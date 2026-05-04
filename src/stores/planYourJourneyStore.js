// Simple in-memory store for plan-your-journey submissions
// Note: This is non-persistent and resets when the server restarts.
const store = [];

const generateId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
};

export const addPlan = (data) => {
  const entry = { _id: generateId(), createdAt: new Date(), ...data };
  store.unshift(entry);
  return entry;
};

export const listPlans = () => {
  return [...store];
};

export const removePlan = (id) => {
  const idx = store.findIndex((s) => s._id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
};

export default { addPlan, listPlans, removePlan };
