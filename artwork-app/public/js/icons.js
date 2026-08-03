// Kumpulan ikon SVG bergaya Instagram (outline/stroke), dipakai di seluruh app
const Icons = {
  logo: `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="11" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="12" y1="14" x2="12" y2="16.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,

  search: `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><line x1="21" y1="21" x2="16.4" y2="16.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  plus: `<svg viewBox="0 0 24 24" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  thumbsUp: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7 11l4.5-7.5a1.5 1.5 0 0 1 2.6.2c.3.6.4 1.3.2 2L13 9h5.5A2 2 0 0 1 20.5 11.5l-1.4 7A2 2 0 0 1 17.1 20H7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>`,

  thumbsUpFilled: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 21H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3z" fill="#00b4ff" stroke="#00b4ff" stroke-width="1.7" stroke-linejoin="round"/><path d="M7 11l4.5-7.5a1.5 1.5 0 0 1 2.6.2c.3.6.4 1.3.2 2L13 9h5.5A2 2 0 0 1 20.5 11.5l-1.4 7A2 2 0 0 1 17.1 20H7" fill="#00b4ff" stroke="#00b4ff" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>`,

  thumbsDown: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M17 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M17 13l-4.5 7.5a1.5 1.5 0 0 1-2.6-.2c-.3-.6-.4-1.3-.2-2L11 15H5.5A2 2 0 0 1 3.5 12.5l1.4-7A2 2 0 0 1 6.9 4H17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>`,

  thumbsDownFilled: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M17 3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3z" fill="#ff3860" stroke="#ff3860" stroke-width="1.7" stroke-linejoin="round"/><path d="M17 13l-4.5 7.5a1.5 1.5 0 0 1-2.6-.2c-.3-.6-.4-1.3-.2-2L11 15H5.5A2 2 0 0 1 3.5 12.5l1.4-7A2 2 0 0 1 6.9 4H17" fill="#ff3860" stroke="#ff3860" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>`,

  comment: `<svg viewBox="0 0 24 24" width="23" height="23"><path d="M21 11.5c0 4.7-4 8.5-9 8.5-1.1 0-2.2-.2-3.1-.5L3 21l1.6-4.8C3.6 14.8 3 13.2 3 11.5 3 6.8 7 3 12 3s9 3.8 9 8.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,

  bookmark: `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h12v18l-6-4.5L6 21V3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,

  user: `<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  logout: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  switchAccount: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M17 2l4 4-4 4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12v-2a4 4 0 0 1 4-4h14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M7 22l-4-4 4-4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v2a4 4 0 0 1-4 4H3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,

  edit: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 20h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,

  close: `<svg viewBox="0 0 24 24" width="18" height="18"><line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,

  camera: `<svg viewBox="0 0 24 24" width="32" height="32"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="14" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,

  trash: `<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="3 6 5 6 21 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,

  send: `<svg viewBox="0 0 24 24" width="18" height="18"><line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,

  shield: `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  lock: `<svg viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,

  back: `<svg viewBox="0 0 24 24" width="20" height="20"><polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  usersGroup: `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 8.5a2.7 2.7 0 1 0 0-5.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M15.5 14.7c2.7.4 4.5 2.3 4.5 5.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,

  grid: `<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>`,

  info: `<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="12" y1="11" x2="12" y2="16.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="7.7" r="1.1" fill="currentColor"/></svg>`,

  calendar: `<svg viewBox="0 0 24 24" width="15" height="15"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="3" y1="9.5" x2="21" y2="9.5" stroke="currentColor" stroke-width="1.6"/><line x1="7.5" y1="3" x2="7.5" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><line x1="16.5" y1="3" x2="16.5" y2="7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
};
