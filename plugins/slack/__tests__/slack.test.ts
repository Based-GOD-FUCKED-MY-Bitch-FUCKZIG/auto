import Auto from '@auto-it/core';
import makeCommitFromMsg from '@auto-it/core/src/__tests__/make-commit-from-msg';
import { dummyLog } from '@auto-it/core/src/utils/logger';
import { makeHooks } from '@auto-it/core/src/utils/make-hooks';
import SlackPlugin from '../src';

const fetchSpy = jest.fn();
// @ts-ignore
jest.mock('node-fetch', () => (...args) => {
  fetchSpy(...args);
});

beforeEach(() => {
  fetchSpy.mockClear();
});

const mockGit = {
  options: {
    owner: 'adierkens',
    repo: 'test'
  },
  getProject: () => ({
    html_url: 'https://github.custom.com/adierkens/test'
  })
};
const mockAuto = ({
  git: mockGit,
  logger: dummyLog()
} as unknown) as Auto;

describe('postToSlack', () => {
  test("doesn't post with no new version", async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    const hooks = makeHooks();

    plugin.postToSlack = jest.fn();
    // @ts-ignore
    plugin.apply({ hooks } as Auto);

    await hooks.afterRelease.promise({
      lastRelease: '0.1.0',
      commits: [],
      releaseNotes: '# My Notes'
    });

    expect(plugin.postToSlack).not.toHaveBeenCalled();
  });

  test("doesn't post in dry run", async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    const hooks = makeHooks();

    plugin.postToSlack = jest.fn();
    // @ts-ignore
    plugin.apply({ hooks, options: { dryRun: true } } as Auto);

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [],
      releaseNotes: '# My Notes'
    });

    expect(plugin.postToSlack).not.toHaveBeenCalled();
  });

  test("doesn't post with no commits", async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    const hooks = makeHooks();

    plugin.postToSlack = jest.fn();
    // @ts-ignore
    plugin.apply({ hooks, options: {} } as Auto);

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [],
      releaseNotes: '# My Notes'
    });

    expect(plugin.postToSlack).not.toHaveBeenCalled();
  });

  test("doesn't post with skip release label", async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    const hooks = makeHooks();

    plugin.postToSlack = jest.fn();
    // @ts-ignore
    plugin.apply({
      hooks,
      options: {},
      release: { options: { skipReleaseLabels: ['skip-release'] } }
    } as Auto);

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('skipped', { labels: ['skip-release'] })],
      releaseNotes: '# My Notes'
    });

    expect(plugin.postToSlack).not.toHaveBeenCalled();
  });

  test("doesn't post without url", async () => {
    // @ts-ignore
    const plugin = new SlackPlugin({ url: undefined });
    const hooks = makeHooks();

    plugin.postToSlack = jest.fn();
    // @ts-ignore
    plugin.apply({ hooks, options: {} } as Auto);

    await expect(
      hooks.afterRelease.promise({
        newVersion: '1.0.0',
        lastRelease: '0.1.0',
        commits: [makeCommitFromMsg('a patch')],
        releaseNotes: '# My Notes'
      })
    ).rejects.toBeInstanceOf(Error);
  });

  test('should warn when no token', async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    const logger = dummyLog();
    logger.verbose.warn = jest.fn();
    process.env.SLACK_TOKEN = '';

    await plugin.postToSlack(
      { ...mockAuto, logger } as Auto,
      '1.0.0',
      '# My Notes\n- PR [some link](google.com)'
    );

    expect(logger.verbose.warn).toHaveBeenCalled();
  });

  test('should call slack api with minimal config', async () => {
    const plugin = new SlackPlugin('https://custom-slack-url');
    process.env.SLACK_TOKEN = 'MY_TOKEN';

    await plugin.postToSlack(
      mockAuto,
      '1.0.0',
      '# My Notes\n- PR [some link](google.com)'
    );

    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://custom-slack-url?token=MY_TOKEN'
    );
    expect(fetchSpy.mock.calls[0][1].body).toMatchSnapshot();
  });

  test('should call slack api', async () => {
    const plugin = new SlackPlugin({ url: 'https://custom-slack-url' });
    const hooks = makeHooks();
    process.env.SLACK_TOKEN = 'MY_TOKEN';
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto);

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)'
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://custom-slack-url?token=MY_TOKEN'
    );
    expect(fetchSpy.mock.calls[0][1].body).toMatchSnapshot();
  });

  test('should call slack api with custom atTarget', async () => {
    const plugin = new SlackPlugin({
      url: 'https://custom-slack-url',
      atTarget: 'here'
    });
    const hooks = makeHooks();
    process.env.SLACK_TOKEN = 'MY_TOKEN';
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto);

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)'
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://custom-slack-url?token=MY_TOKEN'
    );
    expect(fetchSpy.mock.calls[0][1].body.includes('@here'));
    expect(fetchSpy.mock.calls[0][1].body).toMatchSnapshot();
  });
});
