/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  id: string;
  name: string;
  handicap: number;
  email: string;
  joinedDate: string;
  avatar: string;
  role: 'Committee' | 'Member';
  committeeTitle?: string;
  active: boolean; // active/inactive status
  notes?: string;
  gender: 'Male' | 'Female';
  division: string; // the division of the member
}

export interface Season {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Division {
  id: string;
  name: string;
}

export interface GolfCourse {
  id: string;
  name: string;
  location: string;
  par: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  websiteUrl: string;
  imageUrl: string;
  description: string;
  notes?: string;
  holes?: number;
  courseRating?: number;
  slopeRating?: number;
  website?: string;
}

// Event/Tournament model representing renamed Tournaments
export interface Event {
  id: string;
  seasonId: string;
  title: string; // Tournament Name
  courseId: string; // Course
  date: string; // Start Date
  endDate: string; // End Date
  roundsCount: number; // Number of Rounds
  format: 'Stableford' | 'Stroke Play' | 'Modified Stableford'; // Tournament format dropdown selection
  classification?: 'Major' | 'Standard' | 'Alternate' | 'Qualifier';
  status: 'Upcoming' | 'Completed';
  notes?: string;
  maxPlayers?: number;
  time?: string;
}

export interface TournamentResult {
  id: string;
  eventId: string;
  playerId: string;
  grossScore: number;
  handicap?: number; // manual handicap played during tournament
  netScore: number; // gross - handicap adjustment
  points: number; // points awarded based on net finish
  position: number;
}

export interface StandingsRow {
  playerId: string;
  playerName: string;
  handicap: number;
  totalPoints: number;
  eventsPlayed: number;
  wins: number;
  averagePoints: number;
  ranking: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  author: string;
  category: 'Announcement' | 'Tournament Wrapup' | 'Social' | 'General';
  image: string;
  isFeatured: boolean;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string;
  category: 'Tournaments' | 'Courses' | 'Social' | 'Trophy';
  date: string;
}
