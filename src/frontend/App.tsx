import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AlbumCopyPage } from '@/pages/AlbumCopyPage';
import { CompilationBuilderPage } from '@/pages/CompilationBuilderPage';
import { DestinationLibraryPage } from '@/pages/DestinationLibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/albums" element={<AlbumCopyPage />} />
        <Route path="/compilations" element={<CompilationBuilderPage />} />
        <Route path="/destination" element={<DestinationLibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
