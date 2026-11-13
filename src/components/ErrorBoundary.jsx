import { Component } from 'react';
import { translate } from '../i18n/index.js';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('[daneshpaz]', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="empty" role="alert">
          <div className="big" aria-hidden="true">🍳</div>
          <h2>{translate('error.title')}</h2>
          <p>{translate('error.hint')}</p>
          <button className="btn btn-primary" onClick={() => { this.setState({ error: null }); window.location.hash = '/'; }}>
            {translate('error.retry')}
          </button>
        </div>
      </div>
    );
  }
}
