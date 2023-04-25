export enum InputActionKind {
  CHANGE_NAME = 'CHANGE_NAME',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  CHANGE_PASSWORD_CONFIRM = 'CHANGE_PASSWORD_CONFIRM',
  SET_IMAGE = 'SET_IMAGE',
}

// An interface for our actions
export interface InputAction {
  type: InputActionKind;
  payload: any;
}

// An interface for our state
export interface authState {
  name?: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  pic?: any;
}

export const initialState: authState = {
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  pic: '',
};
