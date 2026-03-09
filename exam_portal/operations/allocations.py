from .models import Examinations, RoomAllocation, FacultyAllocation, StudentCourse
from django.db import transaction


def assign_seating_and_invigilation(slot_id):
    """
    Assign seating for students in rooms and assign faculty to their respective invigilation rooms for a given slot.
    """
    try:
        with transaction.atomic():
            # Fetch slot, rooms, faculty, students
            slot = Examinations.objects.get(pk=slot_id)
            rooms = RoomAllocation.objects.filter(slot=slot)
            faculty = FacultyAllocation.objects.filter(slot=slot)
            students = StudentCourse.objects.filter(slot=slot)

            # Example seating assignment logic
            room_seating = {}
            student_list = list(students)
            idx = 0
            for room in rooms:
                room_seating[room.id] = []
                for _ in range(room.capacity):
                    if idx < len(student_list):
                        room_seating[room.id].append(student_list[idx].student_id)
                        idx += 1
            # Example faculty assignment logic
            faculty_rooms = {}
            for fac, room in zip(faculty, rooms):
                faculty_rooms[fac.faculty_id] = room.id

            # Save assignments (implement your own models/logic)
            # ...
            return {
                'room_seating': room_seating,
                'faculty_rooms': faculty_rooms,
                'status': 'success'
            }
    except Exception as e:
        return {'status': 'error', 'error': str(e)}

# Add any helper functions as needed
