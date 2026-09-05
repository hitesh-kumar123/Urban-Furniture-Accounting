import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0D] text-[#F5F2EA] flex">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-150 ${
          collapsed ? 'pl-16' : 'pl-60'
        }`}
      >
        <Header collapsed={collapsed} />
        <main className="flex-1 pt-12 bg-[#0B0B0D] min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
