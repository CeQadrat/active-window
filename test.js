import { ActiveWindowTracker } from './index';

const activeWindowTracker = new ActiveWindowTracker();

activeWindowTracker.registerListener(data => {
  console.log(data);
});

activeWindowTracker.start();
