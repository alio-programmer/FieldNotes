import { Component } from 'react';
import { readRaw } from '../lib/storage.js';

/**
 * Catches render errors so a bug never presents as "your data disappeared".
 * Offers a copy-out of the raw stored payload as a last-resort backup.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep it in the console for whoever is debugging.
    console.error('Fieldnotes crashed:', error, info);
  }

  handleReload = () => window.location.reload();

  handleCopy = async () => {
    const raw = readRaw();
    try {
      await navigator.clipboard.writeText(raw);
      this.setState({ copied: true });
    } catch {
      // Clipboard may be unavailable; fall back to showing the text.
      this.setState({ showRaw: true });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="fn-crash">
        <div className="fn-crash-card">
          <span className="font-mono text-[9px] tracking-[0.17em] text-muted">
            SOMETHING WENT WRONG
          </span>
          <h1 className="mt-3 font-display text-[24px] font-semibold tracking-[-0.8px]">
            The workspace hit a snag.
          </h1>
          <p className="mt-2 text-[13px] leading-[1.7] text-muted">
            Your projects are still saved in this browser. Reloading usually
            fixes it. If it keeps happening, copy your data out before
            clearing anything.
          </p>

          <pre className="fn-crash-detail">
            {String(this.state.error?.message || this.state.error)}
          </pre>

          {this.state.showRaw && (
            <textarea
              className="fn-text-field mt-3"
              rows={6}
              readOnly
              value={readRaw()}
              aria-label="Raw stored data"
            />
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={this.handleReload}
              className="fn-btn-primary"
            >
              Reload the workspace
            </button>
            <button
              type="button"
              onClick={this.handleCopy}
              className="fn-btn-secondary"
            >
              {this.state.copied ? 'Copied ✓' : 'Copy my data'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
