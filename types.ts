export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
  Charon = 'Charon'
}

export enum PauseStrength {
  None = 'None',
  Normal = 'Normal',
  Strong = 'Strong'
}

export interface TTSState {
  isLoading: boolean;
  error: string | null;
}

// FIX: Added missing Profile interface used by ProfileCard and geminiService.
export interface Profile {
  avatarUrl: string;
  name: string;
  email: string;
  bio: string;
}