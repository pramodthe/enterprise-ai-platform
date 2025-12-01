import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  agents: [],
  currentAgent: null,
  status: 'idle',
  error: null
}

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setCurrentAgent: (state, action) => {
      state.currentAgent = action.payload
    },
    setAgents: (state, action) => {
      state.agents = action.payload
    },
    updateAgentStatus: (state, action) => {
      const { agentName, status } = action.payload
      const agent = state.agents.find(a => a.agent_name === agentName)
      if (agent) {
        agent.status = status
      }
    }
  }
})

export const { setCurrentAgent, setAgents, updateAgentStatus } = agentsSlice.actions

export default agentsSlice.reducer