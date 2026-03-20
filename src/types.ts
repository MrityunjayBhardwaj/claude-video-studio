export interface Slide {
  id: string;
  text: string;
  duration: number; // frames at 30fps
  background: string;
  textColor: string;
  fontSize: number;
  subtitle?: string;
}

export interface VideoScript {
  title: string;
  slides: Slide[];
}
