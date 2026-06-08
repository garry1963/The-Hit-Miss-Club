/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Season, GolfCourse, Event, TournamentResult, NewsArticle, GalleryImage } from './types';

export const INITIAL_SEASONS: Season[] = [
  { id: 'season-2026', name: '2026 Season', isActive: true },
  { id: 'season-2025', name: '2025 Season', isActive: false },
];

export const INITIAL_GOLF_COURSES: GolfCourse[] = [
  {
    id: 'course-ballybunion',
    name: 'Ballybunion Golf Club (Old Course)',
    location: 'Kerry, Ireland',
    par: 71,
    difficulty: 'Hard',
    websiteUrl: 'https://www.ballybuniongolfclub.com',
    imageUrl: 'https://picsum.photos/seed/ballybunion/800/600',
    description: 'Located on the scenic north-west coast of County Kerry, Ballybunion Golf Club features two challenging links courses. The Old Course is consistently ranked in the top 30 courses worldwide.',
    notes: 'Wind can be extreme. Precision off the tee is crucial as sand dunes frame almost every fairway.'
  },
  {
    id: 'course-standrews',
    name: 'St. Andrews (Old Course)',
    location: 'Fife, Scotland',
    par: 72,
    difficulty: 'Hard',
    websiteUrl: 'https://www.standrews.com',
    imageUrl: 'https://picsum.photos/seed/standrews/800/600',
    description: 'The oldest and most iconic golf course in the world. The Home of Golf. Known for its massive double greens, deep bunkers, and the Swilcan Bridge.',
    notes: 'Beware of the Hell Bunker on the 14th hole and the iconic Road Hole (17th) which requires hitting over the hotel.'
  },
  {
    id: 'course-druidsglen',
    name: 'Druids Glen Golf Resort',
    location: 'Wicklow, Ireland',
    par: 71,
    difficulty: 'Medium',
    websiteUrl: 'https://www.druidsglenresort.com',
    imageUrl: 'https://picsum.photos/seed/druidsglen/800/600',
    description: 'Known as "The Augusta of Europe", Druids Glen is a beautifully manicured parkland course with pristine water elements, historical ruins, and wonderful flora.',
    notes: 'Beautiful but dangerous water hazards on the back-nine, especially the par-3 12th hole.'
  },
  {
    id: 'course-portmarnock',
    name: 'Portmarnock Golf Club',
    location: 'Dublin, Ireland',
    par: 72,
    difficulty: 'Medium',
    websiteUrl: 'https://www.portmarnockgolfclub.ie',
    imageUrl: 'https://picsum.photos/seed/portmarnock/800/600',
    description: 'A classic championship links course set on a sandy peninsula just north of Dublin. Highly respected for its fair, pure test of links golf.',
    notes: 'Flat but subtle, placing a premium on putting on lightning-fast greens.'
  },
  {
    id: 'course-royaldown',
    name: 'Royal County Down Golf Club',
    location: 'Newcastle, Northern Ireland',
    par: 71,
    difficulty: 'Hard',
    websiteUrl: 'https://www.royalcountydown.org',
    imageUrl: 'https://picsum.photos/seed/royalcountydown/800/600',
    description: 'Set against the dramatic backdrop of the Mountains of Mourne, this is widely considered one of the most naturally beautiful and unforgiving links courses on earth.',
    notes: 'Blind tee shots and rugged "bearded" bunkers await anyone straying from the narrow fairways.'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'member-garry',
    name: 'Garry Davies',
    handicap: 16.4,
    email: 'garrydavies1963@gmail.com',
    joinedDate: '2021-04-12',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=garry',
    role: 'Committee',
    committeeTitle: 'Society President & Founder',
    active: true,
    gender: 'Male',
    notes: 'Consistent driver. Soft touch around the greens. Known to order a pint of Guinness right after finishing.',
    division: 'Premier Division'
  },
  {
    id: 'member-david',
    name: 'David "The Slice" Smith',
    handicap: 12.1,
    email: 'david.smith@hitandmiss.com',
    joinedDate: '2022-03-01',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=david',
    role: 'Committee',
    committeeTitle: 'Secretary & Scorekeeper',
    active: true,
    gender: 'Male',
    notes: 'Incredibly long off the tee but has a heavy slice. Former junior player now getting back to grips.',
    division: 'Premier Division'
  },
  {
    id: 'member-sarah',
    name: 'Sarah Jenkins',
    handicap: 18.2,
    email: 'sarah.j@hitandmiss.com',
    joinedDate: '2022-08-15',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah',
    role: 'Committee',
    committeeTitle: 'Treasurer',
    active: true,
    gender: 'Female',
    notes: 'Metronomic consistency. Rarely misses a fairway, although plays conservative layout golf.',
    division: 'Premier Division'
  },
  {
    id: 'member-john',
    name: 'John "Miss-Hit" Murphy',
    handicap: 22.8,
    email: 'john.murphy@example.com',
    joinedDate: '2023-01-10',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=john',
    role: 'Member',
    active: true,
    gender: 'Male',
    notes: 'The namesake of the club. Lives for the spectacular moments of recovery, usually from deep woods.',
    division: 'Premier Division'
  },
  {
    id: 'member-emma',
    name: 'Emma Watson',
    handicap: 14.5,
    email: 'emma.w@gmail.com',
    joinedDate: '2023-05-22',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=emma',
    role: 'Member',
    active: true,
    gender: 'Female',
    notes: 'Excellent iron player. Calm temperament under pressure. Reigning champion at the St. Andrews Open.',
    division: 'Championship Division'
  },
  {
    id: 'member-alan',
    name: 'Alan "Hook" Miller',
    handicap: 8.4,
    email: 'alan.miller@prolink.com',
    joinedDate: '2021-06-18',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alan',
    role: 'Member',
    active: true,
    gender: 'Male',
    notes: 'Lowest handicap in the club. Smooth swing, though has a natural hook. Very competitive.',
    division: 'Championship Division'
  },
  {
    id: 'member-robert',
    name: 'Robert Boyle',
    handicap: 24.0,
    email: 'robert.boyle@outlook.com',
    joinedDate: '2024-02-14',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=robert',
    role: 'Member',
    active: true,
    gender: 'Male',
    notes: 'Keen learner but struggles with consistency. Loves the tech gadgets - smart watch, rangefinders.',
    division: 'Championship Division'
  },
  {
    id: 'member-paul',
    name: 'Paul "Three-Putt" Higgins',
    handicap: 28.2,
    email: 'paul.higgins@gmail.com',
    joinedDate: '2024-03-01',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=paul',
    role: 'Member',
    active: true,
    gender: 'Male',
    notes: 'Extremely friendly, absolute star in the clubhouse. Putting struggles are legendary.',
    division: 'Championship Division'
  }
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'event-ballybunion-2026',
    seasonId: 'season-2026',
    title: 'Ballybunion Invitational',
    date: '2026-05-15',
    endDate: '2026-05-16',
    roundsCount: 2,
    format: 'Stableford',
    courseId: 'course-ballybunion',
    status: 'Completed',
    notes: 'First tournament of the season. Sunny but blustery. Played off the green tees.',
    maxPlayers: 20
  },
  {
    id: 'event-standrews-2026',
    seasonId: 'season-2026',
    title: 'St. Andrews Society Open',
    date: '2026-06-01',
    endDate: '2026-06-03',
    roundsCount: 3,
    format: 'Stroke Play',
    courseId: 'course-standrews',
    status: 'Completed',
    notes: 'The flagship event of the summer. Followed by a nice dinner in the St. Andrews Clubhouse.',
    maxPlayers: 16
  },
  {
    id: 'event-druidsglen-2026',
    seasonId: 'season-2026',
    title: 'Druids Glen Summer Trophy',
    date: '2026-06-25',
    endDate: '2026-06-25',
    roundsCount: 1,
    format: 'Modified Stableford',
    courseId: 'course-druidsglen',
    status: 'Upcoming',
    notes: 'Tee times from 10:30am. Stableford format. Lunch provided after 18 holes in the conservatory.',
    maxPlayers: 16
  },
  {
    id: 'event-royaldown-2026',
    seasonId: 'season-2026',
    title: 'Royal County Down Autumn Shield',
    date: '2026-08-14',
    endDate: '2026-08-15',
    roundsCount: 2,
    format: 'Stroke Play',
    courseId: 'course-royaldown',
    status: 'Upcoming',
    notes: 'Always a demanding links test. Early start to secure the tee slots. Strict collar shirt policy.',
    maxPlayers: 12
  },
  {
    id: 'event-portmarnock-2026',
    seasonId: 'season-2026',
    title: 'Portmarnock Winter Classic',
    date: '2026-10-05',
    endDate: '2026-10-05',
    roundsCount: 1,
    format: 'Stableford',
    courseId: 'course-portmarnock',
    status: 'Upcoming',
    notes: 'End of season gathering. Handicap reviews following the tournament totals.',
    maxPlayers: 20
  }
];

export const INITIAL_RESULTS: TournamentResult[] = [
  // Event 1: Ballybunion Invitational (May 15)
  // Scoring points format: 1st=25pts, 2nd=18pts, 3rd=15pts, 4th=12pts, 5th=10ps, 6th=8pts, 7th=6pts, 8th=4pts...
  { id: 'res-b-1', eventId: 'event-ballybunion-2026', playerId: 'member-garry', grossScore: 88, netScore: 72, points: 25, position: 1 },
  { id: 'res-b-2', eventId: 'event-ballybunion-2026', playerId: 'member-david', grossScore: 84, netScore: 72, points: 18, position: 2 }, // David tied net but lost countback (back 9)
  { id: 'res-b-3', eventId: 'event-ballybunion-2026', playerId: 'member-emma', grossScore: 88, netScore: 74, points: 15, position: 3 },
  { id: 'res-b-4', eventId: 'event-ballybunion-2026', playerId: 'member-alan', grossScore: 83, netScore: 75, points: 12, position: 4 },
  { id: 'res-b-5', eventId: 'event-ballybunion-2026', playerId: 'member-sarah', grossScore: 94, netScore: 76, points: 10, position: 5 },
  { id: 'res-b-6', eventId: 'event-ballybunion-2026', playerId: 'member-robert', grossScore: 101, netScore: 77, points: 8, position: 6 },
  { id: 'res-b-7', eventId: 'event-ballybunion-2026', playerId: 'member-john', grossScore: 101, netScore: 78, points: 6, position: 7 },
  { id: 'res-b-8', eventId: 'event-ballybunion-2026', playerId: 'member-paul', grossScore: 108, netScore: 80, points: 4, position: 8 },

  // Event 2: St. Andrews Society Open (June 1)
  { id: 'res-s-1', eventId: 'event-standrews-2026', playerId: 'member-emma', grossScore: 85, netScore: 70, points: 25, position: 1 },
  { id: 'res-s-2', eventId: 'event-standrews-2026', playerId: 'member-alan', grossScore: 80, netScore: 72, points: 18, position: 2 },
  { id: 'res-s-3', eventId: 'event-standrews-2026', playerId: 'member-garry', grossScore: 90, netScore: 74, points: 15, position: 3 },
  { id: 'res-s-4', eventId: 'event-standrews-2026', playerId: 'member-robert', grossScore: 99, netScore: 75, points: 12, position: 4 },
  { id: 'res-s-5', eventId: 'event-standrews-2026', playerId: 'member-sarah', grossScore: 94, netScore: 76, points: 10, position: 5 },
  { id: 'res-s-6', eventId: 'event-standrews-2026', playerId: 'member-david', grossScore: 89, netScore: 77, points: 8, position: 6 },
  { id: 'res-s-7', eventId: 'event-standrews-2026', playerId: 'member-john', grossScore: 101, netScore: 78, points: 6, position: 7 },
  { id: 'res-s-8', eventId: 'event-standrews-2026', playerId: 'member-paul', grossScore: 109, netScore: 81, points: 4, position: 8 }
];

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Emma Watson Triumphs at St. Andrews Old Course',
    summary: 'A pristine display of short-game precision leads Watson to secure the most sought-after shield of the year.',
    content: `St. Andrews provided pristine turf and its usual double-green magic for the Hit & Miss Club's second fixture of the 2026 season.\n\nEmma Watson put together an elite scorecard, racking up 3 birdles and managing standard pars across complex holes like the Road Hole 17th. Playing off her 14.5 handicap, Watson carded an 85 gross score for an outstanding net 70, securing first place.\n\nLowest gross of the day went to Alan Miller, who played near-perfect golf to card an 80 gross, translating to a net 72 and taking home second place. Society President Garry Davies took third, rounding off a magnificent weekend.\n\nNext stop: Druids Glen for the Summer Trophy. Registrations are open!`,
    date: '2026-06-02',
    author: 'David Smith',
    category: 'Tournament Wrapup',
    image: 'https://picsum.photos/seed/trophy/800/500',
    isFeatured: true
  },
  {
    id: 'news-2',
    title: 'Summer Matches & Tee Slots: Register for Druids Glen',
    summary: 'Members should register today for the Druids Glen Summer Trophy scheduling on June 25th.',
    content: 'Our third schedule course is the beautiful Druids Glen in Wicklow. Known for its historical structures and blooming trees, this is expected to be a heavily competitive Stableford tournament.\n\nWe have secured 4 tee-off slots beginning at 10:30 AM on Thursday, June 25th. Max capacity is capped at 16 players, so please confirm your availability to Sarah or Garry as soon as possible.\n\nFood and drinks in the conservatory will follow the standard presentation ceremony. Green fees are €85, including the meal.',
    date: '2026-06-05',
    author: 'Sarah Jenkins',
    category: 'Announcement',
    image: 'https://picsum.photos/seed/resort/800/500',
    isFeatured: false
  },
  {
    id: 'news-3',
    title: 'Important Rule Updates: Handicap Adjustments for 2026',
    summary: 'The Committee has released revised regulations regarding handicap adjustments based on tournament standings.',
    content: 'To keep tournaments fair and fun for all handicaps, the Hit & Miss Committee has introduced a new "Winner\'s Trim" rule.\n\nStarting immediately, tournament winners will receive an automatic temporary trim of 1.5 strokes off their handicap for the next three society fixtures. Runners-up will receive a trim of 0.8 strokes. Conversely, players finishing in the bottom three of consecutive events are eligible to request an emergency committee review for a 1.0 stroke easing.\n\nAs Garry always says: "We are hit and miss, but we keep it fair!"',
    date: '2026-05-18',
    author: 'Garry Davies',
    category: 'General',
    image: 'https://picsum.photos/seed/rules/800/500',
    isFeatured: false
  }
];

export const INITIAL_GALLERY: GalleryImage[] = [
  {
    id: 'gal-1',
    imageUrl: 'https://picsum.photos/seed/galgolf1/1000/700',
    caption: 'Garry teeing off on the stunning first hole at St. Andrews Old Course.',
    category: 'Tournaments',
    date: '2026-06-01'
  },
  {
    id: 'gal-2',
    imageUrl: 'https://picsum.photos/seed/galgolf2/1000/700',
    caption: '"The Sweep" across the 18th hole bridge. Team photo of the St. Andrews lineup.',
    category: 'Social',
    date: '2026-06-01'
  },
  {
    id: 'gal-3',
    imageUrl: 'https://picsum.photos/seed/galgolf3/1000/700',
    caption: 'Sunset over Ballybunion golf links after a rigorous Day 1 tournament.',
    category: 'Courses',
    date: '2026-05-15'
  },
  {
    id: 'gal-4',
    imageUrl: 'https://picsum.photos/seed/galgolf4/1000/700',
    caption: 'Emma Watson holding the premium Silver Flask winner\'s trophy.',
    category: 'Trophy',
    date: '2026-06-01'
  },
  {
    id: 'gal-5',
    imageUrl: 'https://picsum.photos/seed/galgolf5/1000/700',
    caption: 'Sarah and David plotting their escape route from the Ballybunion dunes.',
    category: 'Tournaments',
    date: '2026-05-15'
  },
  {
    id: 'gal-6',
    imageUrl: 'https://picsum.photos/seed/galgolf6/1000/700',
    caption: 'The historical castle ruins embedded directly behind St. Andrews green.',
    category: 'Courses',
    date: '2026-06-01'
  }
];
