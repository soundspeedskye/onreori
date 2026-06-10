import type {EventRoom} from '../../types';
import type {MyRooms} from './contracts';

export function splitMyRooms(rooms: EventRoom[], userId: string): MyRooms {
  const createdRooms: EventRoom[] = [];
  const joinedRooms: EventRoom[] = [];
  const seenRoomIds = new Set<string>();

  rooms.forEach(room => {
    if (seenRoomIds.has(room.id)) {
      return;
    }

    seenRoomIds.add(room.id);

    if (room.createdBy === userId) {
      createdRooms.push(room);
    } else {
      joinedRooms.push(room);
    }
  });

  return {createdRooms, joinedRooms};
}
