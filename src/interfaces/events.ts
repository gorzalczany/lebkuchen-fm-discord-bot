export interface PlayXSoundEvent {
  id: 'PlayXSoundEvent',
  soundUrl: string,
}

export interface SayEvent {
  id: 'SayEvent',
  text: string,
}

export type EventData =
  | PlayXSoundEvent
  | SayEvent
