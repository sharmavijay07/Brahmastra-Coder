from dotenv import load_dotenv
from langchain_core.globals import set_verbose, set_debug
from langchain_groq.chat_models import ChatGroq
from langgraph.constants import END
from langgraph.graph import StateGraph
from langgraph.prebuilt import create_react_agent
import sys

from agents.prompts import *
from agents.states import *
from agents.tools import write_file, read_file, get_current_directory, list_files, should_stop

_ = load_dotenv()

set_debug(True)
set_verbose(True)

# ------------------------
# Initialize LLM
# ------------------------
llm = ChatGroq(model="openai/gpt-oss-120b")


# ------------------------
# Utility wrapper for rate-limit handling
# ------------------------
class RateLimitExceeded(Exception):
    """Raised when the LLM provider indicates a rate limit error."""
    pass

def safe_invoke(func, *args, **kwargs):
    """Invoke LLM or agent call with rate-limit handling."""
    try:
        return func(*args, **kwargs)
    except Exception as e:
        # Check if it's a rate-limit error (Groq might raise other types)
        if "rate limit" in str(e).lower():
            print("[ERROR] LLM rate limit exceeded.")
            # Bubble up a clean exception so the server can handle and notify clients
            raise RateLimitExceeded(str(e))
        else:
            raise e


# ------------------------
# Planner Agent
# ------------------------
def planner_agent(state: dict) -> dict:
    """Converts user prompt into a structured Plan."""
    user_prompt = state["user_prompt"]
    resp = safe_invoke(llm.with_structured_output(Plan).invoke, planner_prompt(user_prompt))
    if resp is None:
        raise ValueError("Planner did not return a valid response.")
    return {"plan": resp}


# ------------------------
# Architect Agent
# ------------------------
def architect_agent(state: dict) -> dict:
    """Creates TaskPlan from Plan."""
    plan: Plan = state["plan"]
    resp = safe_invoke(
        llm.with_structured_output(TaskPlan).invoke,
        architect_prompt(plan=plan.model_dump_json())
    )
    if resp is None:
        raise ValueError("Architect did not return a valid response.")

    resp.plan = plan
    print("Generated TaskPlan:", resp.model_dump_json())
    return {"task_plan": resp}


# ------------------------
# Coder Agent
# ------------------------
def coder_agent(state: dict) -> dict:
    """LangGraph tool-using coder agent with safe file writing and rate-limit handling."""
    coder_state: CoderState = state.get("coder_state")
    if coder_state is None:
        coder_state = CoderState(task_plan=state["task_plan"], current_step_idx=0)

    steps = coder_state.task_plan.implementation_steps
    if coder_state.current_step_idx >= len(steps):
        print(f"[INFO] All {len(steps)} tasks completed. Setting status to DONE.")
        return {"coder_state": coder_state, "status": "DONE"}

    # Respect stop requests
    if should_stop():
        print("[INFO] Stop requested. Halting coder agent.")
        return {"coder_state": coder_state, "status": "DONE"}

    current_task = steps[coder_state.current_step_idx]
    print(f"[INFO] Processing step {coder_state.current_step_idx + 1}/{len(steps)}: {current_task.task_description}")
    
    existing_content = read_file.run(current_task.filepath) or ""

    system_prompt = coder_system_prompt()
    user_prompt = (
        f"Task: {current_task.task_description}\n"
        f"File: {current_task.filepath}\n"
        f"Existing content:\n{existing_content}\n\n"
        "IMPORTANT: Use write_file(path, content) to save your changes. "
        "Once you've written the file, your task is complete. Do not loop or retry."
    )

    # Register tools
    coder_tools = [read_file, write_file, list_files, get_current_directory]
    
    # Configure agent with recursion limit for individual tasks
    react_agent = create_react_agent(llm, tools=coder_tools)

    # Safe invocation with rate-limit handling and recursion limit
    try:
        resp = safe_invoke(
            react_agent.invoke,
            {
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            },
            config={"recursion_limit": 15}  # Limit for individual task
        )
        print(f"[SUCCESS] Completed step {coder_state.current_step_idx + 1}")
    except Exception as e:
        print(f"[ERROR] Failed step {coder_state.current_step_idx + 1}: {e}")
        # Continue to next step even if this one fails
    
    coder_state.current_step_idx += 1
    
    # Check if we're done
    if coder_state.current_step_idx >= len(steps):
        return {"coder_state": coder_state, "status": "DONE"}
    
    return {"coder_state": coder_state}


# ------------------------
# Graph Definition
# ------------------------
graph = StateGraph(dict)
graph.add_node("planner", planner_agent)
graph.add_node("architect", architect_agent)
graph.add_node("coder", coder_agent)

graph.add_edge("planner", "architect")
graph.add_edge("architect", "coder")
graph.add_conditional_edges(
    "coder",
    lambda s: "END" if s.get("status") == "DONE" else "coder",
    {"END": END, "coder": "coder"}
)

graph.set_entry_point("planner")
agent = graph.compile()


# ------------------------
# Main Execution
# ------------------------
if __name__ == "__main__":
    try:
        result = agent.invoke(
            {"user_prompt": "Build a colourful modern todo app in html css and js"},
            {"recursion_limit": 150}  # Increased limit for the entire graph
        )
        print("Final State:", result)
    except SystemExit:
        print("[INFO] Execution stopped due to LLM rate limit.")
