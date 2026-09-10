/**
 * HomeOps AI — Time of Day Greeting Utility
 * Dynamically determines greetings, icons, and contextual summaries based on user's current local time.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeGreetingInfo {
  timeOfDay: TimeOfDay;
  label: string;
  greeting: string;
  returningGreeting: string;
  subtext: string;
  emoji: string;
  periodBadgeClass: string;
}

export function getTimeGreeting(overrideHour?: number): TimeGreetingInfo {
  const hour = overrideHour !== undefined ? overrideHour : new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      timeOfDay: 'morning',
      label: 'Morning',
      greeting: 'Good morning',
      returningGreeting: 'Good morning, welcome back',
      subtext: "Here's what needs your attention this morning across the household.",
      emoji: '🌅',
      periodBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      timeOfDay: 'afternoon',
      label: 'Afternoon',
      greeting: 'Good afternoon',
      returningGreeting: 'Good afternoon, welcome back',
      subtext: "Here's your midday household overview and active priorities.",
      emoji: '☀️',
      periodBadgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      timeOfDay: 'evening',
      label: 'Evening',
      greeting: 'Good evening',
      returningGreeting: 'Good evening, welcome back',
      subtext: "Here's your evening household wrap-up and pending items.",
      emoji: '🌆',
      periodBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  } else {
    return {
      timeOfDay: 'night',
      label: 'Night',
      greeting: 'Good night',
      returningGreeting: 'Good night, welcome back',
      subtext: 'Household is winding down. Here is your night summary and checklist.',
      emoji: '🌙',
      periodBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    };
  }
}
