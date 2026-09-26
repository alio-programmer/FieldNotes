import { normalizeProject } from './schema.js';
import { uid } from './id.js';

const DAY = 86400000;

const BLUEPRINTS = [
  {
    name: 'Field guide for a slower morning',
    problem:
      'My mornings start in a scramble. I am checking messages before I have even decided what the day is for.',
    solution:
      'Pick one thing that matters, write it down the night before, and give it a full unhurried hour before opening anything else.',
    tags: ['personal', 'habits'],
    priority: 'high',
    targets: [
      ['Write tomorrow’s one thing before bed', true, 12],
      ['Phone stays in another room until 9am', true, 8],
      ['Keep a one-line journal entry each morning', false, null],
      ['Review the week every Sunday evening', false, null],
    ],
    notes: '# Why\n\nThe goal is not discipline, it is **less friction** at the start of the day.\n\n- Move the phone\n- Leave one book open\n- Prepare clothes the night before',
  },
  {
    name: 'Neighbourhood seed library',
    problem:
      'Half the street has soil and no use for it. The rest of us want to grow things but not take on a whole garden.',
    solution:
      'A small weatherproof box on the corner with a sign-out ledger. Take seeds, leave seeds, note what actually grew.',
    tags: ['community', 'outdoors'],
    priority: 'medium',
    targets: [
      ['Ask the library about a spare shelf', true, 20],
      ['Build a weatherproof seed box', true, 5],
      ['Design the sign-out ledger', false, null],
      ['List the first twelve seed donors', false, null],
      ['Put a sign on the corner', false, null],
    ],
    notes:
      '## Open questions\n\n- Who waters when it is hot?\n- Do we charge for seeds, or trust people?\n\n> Simple beats tidy here.',
  },
  {
    name: 'Rewrite the onboarding email',
    problem:
      'Our welcome email is 400 words long and nobody finishes it. New users are dropping off before they see the value.',
    solution:
      'Cut it to one sentence about their problem, one thing to do, and one link. Move everything else into help docs.',
    tags: ['writing', 'product'],
    priority: 'high',
    targets: [
      ['Ask five users what they expected to happen', true, 3],
      ['Draft a 60-word version', true, 1],
      ['Have the team review the draft', false, null],
      ['A/B test against the current version', false, null],
    ],
    notes:
      'Current first line: *"Welcome aboard! We are thrilled to have you."*\n\nNobody is thrilled. Say the useful thing instead.',
  },
  {
    name: 'Learn to make proper bread',
    problem:
      'I have bought good bread maybe four times in my life. I would like to be able to make it on a Sunday.',
    solution:
      'A starter, a scale, and one loaf a week. Same timings every week until it is boring and then it is reliable.',
    tags: ['cooking'],
    priority: 'low',
    status: 'paused',
    targets: [
      ['Get a jar and start a starter', true, 60],
      ['Buy a scale and a baking tray', true, 58],
      ['Bake one deliberately bad loaf', true, 40],
      ['Bake a second loaf on purpose', false, null],
    ],
    notes: 'The starter died over the holiday. **Restarting it.**',
  },
  {
    name: 'Map every walking route in the park',
    problem:
      'The paths in the park do not match the signs, and I keep ending up somewhere confusing with a heavy bag.',
    solution:
      'Walk each path with a cheap tracker, note the distance and the time, and fix the two signs that actively lie.',
    tags: ['outdoors', 'data'],
    priority: 'low',
    status: 'archived',
    targets: [
      ['Walk the main loop twice', true, 90],
      ['Time the two shortcuts', true, 88],
      ['Report the one broken sign', true, 70],
    ],
    notes: 'Done for now. The signs got replaced in the spring.',
  },
];

/**
 * Sample projects with plausible timestamps, so a first-run visitor can see
 * the heatmap, streaks and progress views populated. Only used when the log
 * is empty and the user asks for it.
 */
export function buildSampleProjects(now = Date.now()) {
  return BLUEPRINTS.map((blueprint, index) => {
    const createdAt = now - (90 - index * 12) * DAY;
    const targets = blueprint.targets.map(
      ([text, done, doneDaysAgo], i) => ({
        id: uid('t'),
        text,
        done,
        createdAt: createdAt + i * DAY,
        doneAt: done ? now - doneDaysAgo * DAY : null,
      })
    );

    const doneCount = targets.filter((t) => t.done).length;
    const project = normalizeProject({
      name: blueprint.name,
      problem: blueprint.problem,
      solution: blueprint.solution,
      notes: blueprint.notes,
      tags: blueprint.tags,
      priority: blueprint.priority,
      status: blueprint.status,
      targets,
      createdAt,
      updatedAt: now - (doneCount ? 1 : 15) * DAY,
    });

    // A short history so the drawer timeline is not empty.
    project.activity = [
      {
        id: uid('a'),
        type: 'created',
        text: 'Project created',
        at: createdAt,
      },
      ...targets
        .filter((t) => t.done)
        .map((t, i) => ({
          id: uid('a'),
          type: 'target-done',
          text: `Completed “${t.text}”`,
          at: t.doneAt ?? now - (i + 1) * DAY,
        })),
    ];

    return project;
  });
}
