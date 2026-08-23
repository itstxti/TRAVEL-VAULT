export type Status = 'want_to_go' | 'planned' | 'visited';
export type DestinationType = 'city' | 'country';

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  type: DestinationType;
  status: Status;
  companions: string[];
  tripStart?: string;
  tripEnd?: string;
  lat: number;
  lng: number;
  journal: JournalEntry[];
  photos: Photo[];
}
