export interface ApprovedReservation {
  roomId: string
  from: Date
  to: Date
}

export interface OccupancyReader {
  findApprovedOverlapping(roomIds: string[], from: Date, to: Date): Promise<ApprovedReservation[]>
}

export interface RoomClosure {
  roomId: string
  from: Date
  to: Date
}

export interface ClosureReader {
  findClosuresOverlapping(roomIds: string[], from: Date, to: Date): Promise<RoomClosure[]>
}

export const emptyOccupancyReader: OccupancyReader = {
  // TODO(SC-34): replace with the approved reservation reader when BOOK exists.
  async findApprovedOverlapping() {
    return []
  },
}

export const emptyClosureReader: ClosureReader = {
  // TODO(SC-45): replace with the room closure reader when closures exist.
  async findClosuresOverlapping() {
    return []
  },
}
