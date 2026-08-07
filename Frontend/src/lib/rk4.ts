/**
 * Runge-Kutta 4th-Order (RK4) Numerical Integrator
 * 
 * Propagates a state vector forward by step size h using a derivative function.
 * State is represented as a flat array of numbers.
 * 
 * References:
 * - Montenbruck, O., & Gill, E. "Satellite Orbits: Models, Methods and Applications", Springer.
 */

export type DerivativeFn = (state: number[]) => number[];

export function rk4Step(
  state: number[],
  h: number,
  deriv: DerivativeFn
): number[] {
  const n = state.length;
  
  // k1 = f(y)
  const k1 = deriv(state);
  
  // k2 = f(y + 0.5 * h * k1)
  const tempState2 = new Array(n);
  for (let i = 0; i < n; i++) {
    tempState2[i] = state[i] + 0.5 * h * k1[i];
  }
  const k2 = deriv(tempState2);
  
  // k3 = f(y + 0.5 * h * k2)
  const tempState3 = new Array(n);
  for (let i = 0; i < n; i++) {
    tempState3[i] = state[i] + 0.5 * h * k2[i];
  }
  const k3 = deriv(tempState3);
  
  // k4 = f(y + h * k3)
  const tempState4 = new Array(n);
  for (let i = 0; i < n; i++) {
    tempState4[i] = state[i] + h * k3[i];
  }
  const k4 = deriv(tempState4);
  
  // y_next = y + (h / 6) * (k1 + 2*k2 + 2*k3 + k4)
  const nextState = new Array(n);
  for (let i = 0; i < n; i++) {
    nextState[i] = state[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  
  return nextState;
}
