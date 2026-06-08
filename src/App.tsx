/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSocietyState } from './useSocietyState';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeTab from './components/HomeTab';
import AboutTab from './components/AboutTab';
import EventsTab from './components/EventsTab';
import ResultsTab from './components/ResultsTab';
import LeagueTab from './components/LeagueTab';
import CoursesTab from './components/CoursesTab';
import MembersTab from './components/MembersTab';
import GalleryTab from './components/GalleryTab';
import ContactTab from './components/ContactTab';
import AdminPanelTab from './components/AdminPanelTab';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const state = useSocietyState();

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeTab
            setCurrentTab={setCurrentTab}
            events={state.events}
            news={state.news}
            members={state.members}
            standings={state.standings}
            courses={state.courses}
            isAdmin={state.isAdmin}
            siteContent={state.siteContent}
            updateSiteContent={state.updateSiteContent}
          />
        );
      case 'about':
        return (
          <AboutTab
            members={state.members}
            setCurrentTab={setCurrentTab}
            isAdmin={state.isAdmin}
            siteContent={state.siteContent}
            updateSiteContent={state.updateSiteContent}
          />
        );
      case 'events':
        return (
          <EventsTab
            events={state.events}
            setEvents={state.setEvents}
            courses={state.courses}
            seasons={state.seasons}
            activeSeasonId={state.activeSeasonId}
            isAdmin={state.isAdmin}
            addEvent={state.addEvent}
            updateEvent={state.updateEvent}
            deleteEvent={state.deleteEvent}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'results':
        return (
          <ResultsTab
            events={state.events}
            results={state.results}
            members={state.members}
            courses={state.courses}
            activeSeasonId={state.activeSeasonId}
            isAdmin={state.isAdmin}
            setEventResults={state.setEventResults}
            deleteResult={state.deleteResult}
          />
        );
      case 'league':
        return (
          <LeagueTab
            members={state.members}
            setMembers={state.setMembers}
            seasons={state.seasons}
            divisions={state.divisions}
            addDivision={state.addDivision}
            deleteDivision={state.deleteDivision}
            results={state.results}
            events={state.events}
            activeSeasonId={state.activeSeasonId}
            isAdmin={state.isAdmin}
            updateMember={state.updateMember}
            siteContent={state.siteContent}
            updateSiteContent={state.updateSiteContent}
          />
        );
      case 'courses':
        return (
          <CoursesTab
            courses={state.courses}
            isAdmin={state.isAdmin}
            addCourse={state.addCourse}
            updateCourse={state.updateCourse}
            deleteCourse={state.deleteCourse}
          />
        );
      case 'members':
        return (
          <MembersTab
            members={state.members}
            results={state.results}
            events={state.events}
            seasons={state.seasons}
            divisions={state.divisions}
            activeSeasonId={state.activeSeasonId}
            isAdmin={state.isAdmin}
            addMember={state.addMember}
            updateMember={state.updateMember}
            deleteMember={state.deleteMember}
          />
        );
      case 'gallery':
        return (
          <GalleryTab
            gallery={state.gallery}
            isAdmin={state.isAdmin}
            addGalleryImage={state.addGalleryImage}
            deleteGalleryImage={state.deleteGalleryImage}
          />
        );
      case 'contact':
        return (
          <ContactTab
            isAdmin={state.isAdmin}
            siteContent={state.siteContent}
            updateSiteContent={state.updateSiteContent}
          />
        );
      case 'admin':
        return (
          <AdminPanelTab
            news={state.news}
            members={state.members}
            events={state.events}
            results={state.results}
            gallery={state.gallery}
            isAdmin={state.isAdmin}
            addNews={state.addNews}
            updateNews={state.updateNews}
            deleteNews={state.deleteNews}
            resetDatabase={state.resetDatabase}
            seasons={state.seasons}
            addSeason={state.addSeason}
            activeSeasonId={state.activeSeasonId}
            toggleSeasonActive={state.toggleSeasonActive}
          />
        );
      default:
        return (
          <HomeTab
            setCurrentTab={setCurrentTab}
            events={state.events}
            news={state.news}
            members={state.members}
            standings={state.standings}
            courses={state.courses}
            isAdmin={state.isAdmin}
            siteContent={state.siteContent}
            updateSiteContent={state.updateSiteContent}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F4] flex flex-col justify-between font-sans antialiased text-stone-800">
      
      {/* 1. System Header with Navigations & Admin Controls */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAdmin={state.isAdmin}
        setIsAdmin={state.setIsAdmin}
        seasons={state.seasons}
        activeSeasonId={state.activeSeasonId}
        setActiveSeasonId={state.setActiveSeasonId}
      />

      {/* 2. Main Page Content frame with animated mount fade-ins */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            id={`main-content-${currentTab}`}
          >
            {renderActiveTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. Global custom footer */}
      <Footer 
        setCurrentTab={setCurrentTab} 
        isAdmin={state.isAdmin} 
      />

    </div>
  );
}
