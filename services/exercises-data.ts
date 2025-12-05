export interface Exercise {
    id?: number;
    name: string;
    category: string;
    muscles: string;
    equipment: string;
    default_sets: number;
    default_reps: number;
    is_timed: number;
    demo_video_url: string;
    cues: string;
    is_favorite: number;
}

export const EXERCISE_CATEGORIES = {
    BARBELL: 'Barbell',
    DUMBBELL: 'Dumbbell',
    BODYWEIGHT: 'Bodyweight',
    MACHINE: 'Machine',
    CARDIO: 'Cardio',
    CORE: 'Core',
    MOBILITY: 'Mobility',
};

export const DEFAULT_EXERCISES: Omit<Exercise, 'id'>[] = [
    // Barbell Exercises
    {
        name: 'Barbell Back Squat',
        category: EXERCISE_CATEGORIES.BARBELL,
        muscles: 'Quadriceps, Glutes, Hamstrings',
        equipment: 'Barbell, Rack',
        default_sets: 4,
        default_reps: 8,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Place bar on upper traps',
            'Feet shoulder-width apart',
            'Push knees out as you descend',
            'Keep chest up and core braced',
            'Drive through heels to stand'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Barbell Deadlift',
        category: EXERCISE_CATEGORIES.BARBELL,
        muscles: 'Hamstrings, Glutes, Lower Back, Traps',
        equipment: 'Barbell',
        default_sets: 3,
        default_reps: 6,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Bar over mid-foot',
            'Grip just outside legs',
            'Engage lats, chest up',
            'Push floor away with legs',
            'Lock out hips at top'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Barbell Bench Press',
        category: EXERCISE_CATEGORIES.BARBELL,
        muscles: 'Chest, Triceps, Shoulders',
        equipment: 'Barbell, Bench',
        default_sets: 4,
        default_reps: 8,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Retract shoulder blades',
            'Grip slightly wider than shoulders',
            'Lower bar to mid-chest',
            'Press up and slightly back',
            'Keep elbows at 45 degrees'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Barbell Overhead Press',
        category: EXERCISE_CATEGORIES.BARBELL,
        muscles: 'Shoulders, Triceps, Upper Chest',
        equipment: 'Barbell',
        default_sets: 4,
        default_reps: 8,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Bar at collarbone level',
            'Grip just outside shoulders',
            'Brace core tightly',
            'Press straight up',
            'Shrug at top for lockout'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Barbell Row',
        category: EXERCISE_CATEGORIES.BARBELL,
        muscles: 'Upper Back, Lats, Biceps',
        equipment: 'Barbell',
        default_sets: 4,
        default_reps: 10,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hinge at hips, torso parallel to floor',
            'Pull bar to lower chest/upper abdomen',
            'Squeeze shoulder blades together',
            'Keep elbows close to body',
            'Control descent'
        ]),
        is_favorite: 0,
    },

    // Dumbbell/Kettlebell Exercises
    {
        name: 'Dumbbell Goblet Squat',
        category: EXERCISE_CATEGORIES.DUMBBELL,
        muscles: 'Quadriceps, Glutes',
        equipment: 'Dumbbell',
        default_sets: 3,
        default_reps: 12,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hold dumbbell at chest',
            'Elbows between knees',
            'Squat deep',
            'Keep torso upright',
            'Drive through heels'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Dumbbell Lunges',
        category: EXERCISE_CATEGORIES.DUMBBELL,
        muscles: 'Quadriceps, Glutes, Hamstrings',
        equipment: 'Dumbbells',
        default_sets: 3,
        default_reps: 10,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hold dumbbells at sides',
            'Step forward into lunge',
            'Back knee nearly touches ground',
            'Keep torso upright',
            'Push through front heel'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Dumbbell Shoulder Press',
        category: EXERCISE_CATEGORIES.DUMBBELL,
        muscles: 'Shoulders, Triceps',
        equipment: 'Dumbbells',
        default_sets: 3,
        default_reps: 10,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Start at shoulder height',
            'Press up and slightly in',
            'Avoid arching back',
            'Control the descent',
            'Keep core tight'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Dumbbell Romanian Deadlift',
        category: EXERCISE_CATEGORIES.DUMBBELL,
        muscles: 'Hamstrings, Glutes, Lower Back',
        equipment: 'Dumbbells',
        default_sets: 3,
        default_reps: 12,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hold dumbbells in front of thighs',
            'Hinge at hips, slight knee bend',
            'Keep back flat',
            'Lower until hamstring stretch',
            'Drive hips forward to return'
        ]),
        is_favorite: 0,
    },

    // Bodyweight Exercises
    {
        name: 'Push-ups',
        category: EXERCISE_CATEGORIES.BODYWEIGHT,
        muscles: 'Chest, Triceps, Shoulders',
        equipment: 'None',
        default_sets: 3,
        default_reps: 15,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hands shoulder-width apart',
            'Body in straight line',
            'Lower chest to floor',
            'Push back up',
            'Keep core engaged'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Pull-ups',
        category: EXERCISE_CATEGORIES.BODYWEIGHT,
        muscles: 'Lats, Biceps, Upper Back',
        equipment: 'Pull-up Bar',
        default_sets: 3,
        default_reps: 8,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hang from bar, hands shoulder-width',
            'Pull chest to bar',
            'Squeeze shoulder blades',
            'Control descent',
            'Full arm extension at bottom'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Bodyweight Squats',
        category: EXERCISE_CATEGORIES.BODYWEIGHT,
        muscles: 'Quadriceps, Glutes',
        equipment: 'None',
        default_sets: 3,
        default_reps: 20,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Feet shoulder-width apart',
            'Arms forward for balance',
            'Squat until thighs parallel',
            'Keep chest up',
            'Drive through heels'
        ]),
        is_favorite: 0,
    },

    // Core Exercises
    {
        name: 'Plank',
        category: EXERCISE_CATEGORIES.CORE,
        muscles: 'Core, Abs, Lower Back',
        equipment: 'None',
        default_sets: 3,
        default_reps: 60,
        is_timed: 1,
        demo_video_url: '',
        cues: JSON.stringify([
            'Forearms on ground',
            'Body in straight line',
            'Engage core and glutes',
            'Hold position',
            'Breathe steadily'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Hanging Leg Raises',
        category: EXERCISE_CATEGORIES.CORE,
        muscles: 'Lower Abs, Hip Flexors',
        equipment: 'Pull-up Bar',
        default_sets: 3,
        default_reps: 12,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Hang from bar',
            'Raise legs to 90 degrees',
            'Control the movement',
            'Avoid swinging',
            'Lower with control'
        ]),
        is_favorite: 0,
    },

    // Machine Exercises
    {
        name: 'Lat Pulldown',
        category: EXERCISE_CATEGORIES.MACHINE,
        muscles: 'Lats, Biceps, Upper Back',
        equipment: 'Cable Machine',
        default_sets: 3,
        default_reps: 12,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Grip bar wider than shoulders',
            'Pull bar to upper chest',
            'Squeeze lats at bottom',
            'Keep torso upright',
            'Control the return'
        ]),
        is_favorite: 0,
    },
    {
        name: 'Leg Press',
        category: EXERCISE_CATEGORIES.MACHINE,
        muscles: 'Quadriceps, Glutes, Hamstrings',
        equipment: 'Leg Press Machine',
        default_sets: 3,
        default_reps: 12,
        is_timed: 0,
        demo_video_url: '',
        cues: JSON.stringify([
            'Feet shoulder-width on platform',
            'Lower until 90-degree knee bend',
            'Push through heels',
            'Avoid locking knees',
            'Control the descent'
        ]),
        is_favorite: 0,
    },

    // Cardio
    {
        name: 'Running',
        category: EXERCISE_CATEGORIES.CARDIO,
        muscles: 'Full Body Cardio',
        equipment: 'Treadmill or Outdoors',
        default_sets: 1,
        default_reps: 30,
        is_timed: 1,
        demo_video_url: '',
        cues: JSON.stringify([
            'Maintain steady pace',
            'Land mid-foot',
            'Keep shoulders relaxed',
            'Swing arms naturally',
            'Breathe rhythmically'
        ]),
        is_favorite: 0,
    },
];
