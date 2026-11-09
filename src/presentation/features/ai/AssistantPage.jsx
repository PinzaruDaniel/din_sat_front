import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext.js';
import { useServices } from '../../shared/hooks/ServicesContext.js';
import { Button } from '../../shared/ui/Button.jsx';
import { money } from '../../../shared/lib/format.js';
import './assistant.css';

export function AssistantPage() {
  const { assistant } = useServices();
  const cart = useCart();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [turns, setTurns] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const activeRequest = useRef(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function run(action, task, onError) {
    const controller = new AbortController();
    activeRequest.current = controller;
    setPending(action);
    setError('');
    try {
      await task(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) onError(error);
    } finally {
      if (!controller.signal.aborted) {
        activeRequest.current = null;
        setPending(null);
      }
    }
  }

  async function send(event) {
    event.preventDefault();
    const prompt = message.trim();
    if (!prompt || activeRequest.current) return;
    await run(
      'chat',
      async (signal) => {
        const result = await assistant.chat(
          prompt,
          turns.slice(-4).map((turn) => turn.prompt),
          signal,
        );
        if (signal.aborted) return;
        setTurns((history) => [...history, { prompt, answer: result.message }]);
        setProposal(result.proposal);
        setReplacing(false);
        setMessage('');
      },
      (error) => {
        setError(
          error.code === 'AI_UNAVAILABLE'
            ? 'Asistentul este indisponibil momentan. Poți continua în catalog.'
            : error.message,
        );
      },
    );
  }

  async function confirm() {
    if (!proposal || activeRequest.current) return;
    if (cart.items.length && !replacing) {
      setReplacing(true);
      return;
    }
    await run(
      'confirm',
      async (signal) => {
        const result = await assistant.confirm(proposal.id, signal);
        if (signal.aborted) return;
        cart.dispatch({ type: 'replace', items: result.items });
        navigate('/cart');
      },
      (error) => {
        setError(error.message);
        setReplacing(false);
        if (['PROPOSAL_NOT_FOUND', 'PROPOSAL_CHANGED'].includes(error.code))
          setProposal(null);
      },
    );
  }

  function decline() {
    setProposal(null);
    setReplacing(false);
    setError('');
  }

  return (
    <section className="container page-section assistant">
      <h1>Asistent de cumpărături</h1>
      <p>
        Spune-ne ce cauți, de exemplu „legume pentru o salată” sau „mere și
        pere”.
      </p>
      <Link className="text-link" to="/">
        Continuă în catalog
      </Link>
      <div role="log" aria-label="Conversație">
        {turns.map(({ prompt, answer }, index) => (
          <article className="assistant-card" key={index}>
            <p>
              <strong>Tu</strong> {prompt}
            </p>
            <p>
              <strong>DinSat</strong> {answer}
            </p>
          </article>
        ))}
      </div>
      <form className="assistant-form" onSubmit={send}>
        <label htmlFor="assistant-message">Ce produse cauți?</label>
        <textarea
          id="assistant-message"
          required
          rows="3"
          maxLength={600}
          value={message}
          disabled={Boolean(pending)}
          onChange={(event) => setMessage(event.target.value)}
        />
        <Button
          type="submit"
          loading={pending === 'chat'}
          disabled={Boolean(pending) || !message.trim()}
        >
          Trimite
        </Button>
      </form>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {proposal && (
        <article className="assistant-card" aria-label="Propunere de coș">
          <h2>Propunere de coș</h2>
          <ul>
            {proposal.items.map(({ product, quantity }) => (
              <li key={product.id}>
                {product.title} · {quantity} {product.unit}
              </li>
            ))}
          </ul>
          <p>
            <strong>Total estimat {money(proposal.totalAmount)} MDL</strong>
          </p>
          {replacing && (
            <p role="status">
              Confirmă înlocuirea produselor din coșul actual.
            </p>
          )}
          <div className="assistant-actions">
            <Button
              onClick={confirm}
              loading={pending === 'confirm'}
              disabled={Boolean(pending)}
            >
              {replacing ? 'Înlocuiește coșul' : 'Adaugă propunerea în coș'}
            </Button>
            <Button
              variant="secondary"
              onClick={decline}
              disabled={Boolean(pending)}
            >
              Refuză propunerea
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
