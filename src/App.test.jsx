import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { LEGACY_KEY } from './lib/schema.js';

function seedLegacy(projects) {
  localStorage.setItem(LEGACY_KEY, JSON.stringify(projects));
}

beforeEach(() => {
  localStorage.clear();
});

describe('App: first run', () => {
  it('shows the empty state and no projects', () => {
    render(<App />);
    expect(
      screen.getByText('Every good thing starts somewhere.')
    ).toBeInTheDocument();
    expect(screen.getByText('Your projects')).toBeInTheDocument();
  });
});

describe('App: legacy data', () => {
  it('shows projects saved by the previous version', () => {
    seedLegacy([
      {
        id: 'old-1',
        name: 'Legacy project',
        problem: 'Old problem',
        solution: 'Old approach',
        targets: [{ text: 'Step one', done: true }],
        createdAt: 1000,
        updatedAt: 2000,
      },
    ]);

    render(<App />);
    expect(screen.getByText('Legacy project')).toBeInTheDocument();
    expect(screen.getByText('Old problem')).toBeInTheDocument();
  });
});

describe('App: creating a project', () => {
  it('adds a project and its targets', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /new project/i }));
    await user.type(screen.getByPlaceholderText(/morning routine/i), 'Test project');
    await user.type(
      screen.getByPlaceholderText(/Talk to three/i),
      'First target{Enter}Second target'
    );
    await user.click(screen.getByRole('button', { name: /save project/i }));

    expect(await screen.findByText('Test project')).toBeInTheDocument();
    expect(screen.getByText('First target')).toBeInTheDocument();
    expect(screen.getByText('Second target')).toBeInTheDocument();
  });

  it('requires a name', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /new project/i }));
    await user.click(screen.getByRole('button', { name: /save project/i }));

    // The form is still open because the required field blocked submission.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('App: target done-state regression', () => {
  it('keeps a target checked after renaming its text', async () => {
    const user = userEvent.setup();
    seedLegacy([
      {
        id: 'p1',
        name: 'Keeps state',
        targets: [
          { text: 'Original text', done: true },
          { text: 'Another', done: false },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      },
    ]);

    render(<App />);
    expect(screen.getByText('Original text')).toBeInTheDocument();

    // Open the edit form.
    await user.click(screen.getByRole('button', { name: /^edit keeps state$/i }));

    const targetsField = screen.getByPlaceholderText(/Talk to three/i);
    await user.clear(targetsField);
    await user.type(targetsField, 'Renamed text{Enter}Another');

    await user.click(screen.getByRole('button', { name: /save project/i }));

    // The renamed target must still be checked. This used to fail because
    // targets were matched by their text.
    const renamed = await screen.findByText('Renamed text');
    expect(renamed).toBeInTheDocument();
    expect(renamed.closest('label').querySelector('input')).toBeChecked();
  });
});

describe('App: toggling targets', () => {
  it('checks a target and updates the percentage', async () => {
    const user = userEvent.setup();
    seedLegacy([
      {
        id: 'p1',
        name: 'Toggles',
        targets: [
          { text: 'One', done: false },
          { text: 'Two', done: false },
        ],
        createdAt: 1000,
        updatedAt: 2000,
      },
    ]);

    render(<App />);
    // "0%" appears in both the stats bar and the card, so scope to the card.
    const card = screen.getByText('Toggles').closest('article');
    expect(within(card).getByText('0%')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /mark one complete/i }));

    expect(await within(card).findByText('50%')).toBeInTheDocument();
  });
});
describe('App: search and filter', () => {
  const three = () => [
    { id: 'a', name: 'Alpha', targets: [], createdAt: 300, updatedAt: 300 },
    { id: 'b', name: 'Beta', targets: [], createdAt: 200, updatedAt: 200 },
    { id: 'c', name: 'Gamma', targets: [], createdAt: 100, updatedAt: 100 },
  ];

  it('narrows the list as you type', async () => {
    const user = userEvent.setup();
    seedLegacy(three());
    render(<App />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: /search projects/i }), 'bet');

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows a clear-filters affordance when nothing matches', async () => {
    const user = userEvent.setup();
    seedLegacy(three());
    render(<App />);

    await user.type(
      screen.getByRole('searchbox', { name: /search projects/i }),
      'zzzzz'
    );

    expect(
      screen.getByText('Nothing found just yet.')
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0]);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('hides archived projects unless asked for', async () => {
    const user = userEvent.setup();
    seedLegacy([
      ...three().slice(0, 2),
      {
        id: 'z',
        name: 'Archived one',
        status: 'archived',
        targets: [],
        createdAt: 50,
        updatedAt: 50,
      },
    ]);
    render(<App />);

    expect(screen.queryByText('Archived one')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^archived/i }));
    expect(screen.getByText('Archived one')).toBeInTheDocument();
  });
});

describe('App: delete and undo', () => {
  it('removes a project and can restore it', async () => {
    const user = userEvent.setup();
    seedLegacy([
      { id: 'a', name: 'Removable', targets: [], createdAt: 100, updatedAt: 100 },
    ]);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^delete removable$/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(screen.queryByText('Removable')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByText('Removable')).toBeInTheDocument();
  });

  it('cancels the delete without removing anything', async () => {
    const user = userEvent.setup();
    seedLegacy([
      { id: 'a', name: 'Kept', targets: [], createdAt: 100, updatedAt: 100 },
    ]);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^delete kept$/i }));
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.getByText('Kept')).toBeInTheDocument();
  });
});

describe('App: keyboard shortcuts', () => {
  it('opens the new project dialog with n', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.keyboard('n');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('does not trigger n while typing in the search box', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('searchbox', { name: /search projects/i }));
    await user.keyboard('nann');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the shortcuts dialog with ?', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('?');
    expect(
      await screen.findByText('Keyboard shortcuts')
    ).toBeInTheDocument();
  });

  it('closes a dialog with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('n');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});

describe('App: drawer', () => {
  it('opens details and shows the notes rendered', async () => {
    const user = userEvent.setup();
    seedLegacy([
      {
        id: 'a',
        name: 'Detailed',
        notes: '# Findings\n\n- **speed** matters',
        targets: [],
        createdAt: 100,
        updatedAt: 100,
      },
    ]);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^open detailed$/i }));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Findings')).toBeInTheDocument();
    expect(within(drawer).getByText('speed').tagName).toBe('STRONG');
  });

  it('adds a target from the drawer', async () => {
    const user = userEvent.setup();
    seedLegacy([
      { id: 'a', name: 'Adder', targets: [], createdAt: 100, updatedAt: 100 },
    ]);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^open adder$/i }));
    const drawer = await screen.findByRole('dialog');

    await user.type(
      within(drawer).getByLabelText('Add a target'),
      'Brand new target'
    );
    await user.click(within(drawer).getByRole('button', { name: /^add$/i }));

    expect(
      await within(drawer).findByLabelText(/mark brand new target complete/i)
    ).toBeInTheDocument();
  });
});

describe('App: accessibility basics', () => {
  it('gives the dialog an accessible name', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('n');
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName(/start a project/i);
  });

  it('exposes a skip link to the main content', () => {
    render(<App />);
    expect(
      screen.getByRole('link', { name: /skip to content/i })
    ).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('marks the active filter with aria-pressed', () => {
    seedLegacy([{ id: 'a', name: 'X', targets: [], createdAt: 1, updatedAt: 1 }]);
    render(<App />);

    const all = screen.getByRole('button', { name: /^all/i });
    expect(all).toHaveAttribute('aria-pressed', 'true');
  });
});
