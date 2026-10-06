import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeatEventsService } from './seat-events.service';

describe('SeatEventsService', () => {
  let subscriber: {
    on: ReturnType<typeof vi.fn>;
    psubscribe: ReturnType<typeof vi.fn>;
    quit: ReturnType<typeof vi.fn>;
  };
  let redis: {
    client: { config: ReturnType<typeof vi.fn> };
    createSubscriber: ReturnType<typeof vi.fn>;
  };
  let service: SeatEventsService;

  const emit = (channel: string, message: string) => {
    const handler = subscriber.on.mock.calls[0][1] as (
      pattern: string,
      channel: string,
      message: string,
    ) => void;
    handler('pattern', channel, message);
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    subscriber = {
      on: vi.fn(),
      psubscribe: vi.fn().mockResolvedValue(2),
      quit: vi.fn().mockResolvedValue('OK'),
    };
    redis = {
      client: { config: vi.fn().mockResolvedValue('OK') },
      createSubscriber: vi.fn().mockReturnValue(subscriber),
    };
    service = new SeatEventsService(redis as never);
    await service.onModuleInit();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enables keyspace notifications and subscribes to both channels', () => {
    expect(redis.client.config).toHaveBeenCalledWith('SET', 'notify-keyspace-events', 'Ex');
    expect(subscriber.psubscribe).toHaveBeenCalledWith('seats:*', '__keyevent@*__:expired');
  });

  it('still subscribes when keyspace notifications cannot be enabled', async () => {
    const failing = {
      client: { config: vi.fn().mockRejectedValue(new Error('NOPERM')) },
      createSubscriber: vi.fn().mockReturnValue(subscriber),
    };
    const instance = new SeatEventsService(failing as never);

    await instance.onModuleInit();

    expect(subscriber.psubscribe).toHaveBeenCalledTimes(2);
  });

  it('delivers changed seats of a session after a short delay', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('seats:session-1', JSON.stringify({ seatIds: ['a', 'b'] }));
    expect(listener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(['a', 'b']);
  });

  it('merges and de-duplicates events that arrive within the delay', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('seats:session-1', JSON.stringify({ seatIds: ['a', 'b'] }));
    emit('seats:session-1', JSON.stringify({ seatIds: ['b', 'c'] }));
    vi.advanceTimersByTime(200);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].sort()).toEqual(['a', 'b', 'c']);
  });

  it('turns expired hold keys into seat events', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('__keyevent@0__:expired', 'hold:session-1:seat-9');
    vi.advanceTimersByTime(200);

    expect(listener).toHaveBeenCalledWith(['seat-9']);
  });

  it('ignores expired keys that are not holds', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('__keyevent@0__:expired', 'bull:something:else');
    vi.advanceTimersByTime(200);

    expect(listener).not.toHaveBeenCalled();
  });

  it('does not notify listeners of other sessions', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('seats:session-2', JSON.stringify({ seatIds: ['a'] }));
    vi.advanceTimersByTime(200);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe('session-1', listener);

    unsubscribe();
    emit('seats:session-1', JSON.stringify({ seatIds: ['a'] }));
    vi.advanceTimersByTime(200);

    expect(listener).not.toHaveBeenCalled();
  });

  it('ignores malformed messages', () => {
    const listener = vi.fn();
    service.subscribe('session-1', listener);

    emit('seats:session-1', 'not-json');
    vi.advanceTimersByTime(200);

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps notifying other listeners when one of them throws', () => {
    const broken = vi.fn(() => {
      throw new Error('socket closed');
    });
    const healthy = vi.fn();
    service.subscribe('session-1', broken);
    service.subscribe('session-1', healthy);

    emit('seats:session-1', JSON.stringify({ seatIds: ['a'] }));
    vi.advanceTimersByTime(200);

    expect(healthy).toHaveBeenCalledWith(['a']);
  });

  it('closes the subscriber on shutdown', async () => {
    await service.onModuleDestroy();

    expect(subscriber.quit).toHaveBeenCalled();
  });
});
