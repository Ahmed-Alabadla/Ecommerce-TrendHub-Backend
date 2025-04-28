import { Column } from 'typeorm';

export class Dimensions {
  @Column({ type: 'float' })
  length: number; // "in cm"

  @Column({ type: 'float' })
  width: number; // "in cm"

  @Column({ type: 'float' })
  height: number; // "in cm"
}
