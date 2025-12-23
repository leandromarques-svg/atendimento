
import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Ticket, Clock, Activity, TrendingUp, Filter,
  Upload, ChevronLeft, ChevronRight, Calendar,
  LayoutDashboard, Database, Download, Tag, User, Sparkles, Brain, Lightbulb, Target
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GoogleGenAI } from "@google/genai";
import { parseCSVData, formatSecondsToTime } from './utils';
import { TicketData } from './types';
import ReactMarkdown from 'react-markdown';

const BRAND_COLOR = '#3f2666';
const FRESH_COLOR = '#10b981';
const BLIP_COLOR = '#3f2666';
const COLORS = [BRAND_COLOR, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#64748b'];
const ITEMS_PER_PAGE = 50;

// SVG Path da Logo para reuso (Extraído exatamente do XML enviado pelo usuário)
const LOGO_PATHS = [
  "M1020.65,271.61c-1.34-.7-4.2-1.4-7.15-1.4-6.3,0-12.39,3.64-12.39,10.78,0,3.85,2.17,6.37,7.77,8.47,2.03.77,2.73,1.96,2.73,3.36,0,3.22-2.87,5.25-6.79,5.25-3.43,0-5.88-.7-8.12-2.1v6.02c2.1.98,4.34,1.47,7.49,1.47,8.54,0,13.86-5.11,13.86-11.06,0-4.27-2.1-6.79-8.12-9.03-1.89-.7-2.73-1.68-2.73-3.29,0-2.66,2.66-4.76,5.95-4.76,2.8,0,4.97.42,6.37,1.19l1.12-4.9ZM984.93,283.79c0,7.63-6.23,14.07-12.39,14.07-4.41,0-7.14-2.59-7.14-7.98,0-7.56,6.16-14.07,12.39-14.07,4.34,0,7.14,2.66,7.14,7.98M991.37,283.23c0-8.19-5.39-13.02-12.95-13.02-10.43,0-19.53,9.03-19.53,20.3,0,8.19,5.39,12.95,12.95,12.95,10.43,0,19.53-8.96,19.53-20.23M950.96,278.82c0-5.18-4.48-8.61-8.96-8.61-6.16,0-9.38,2.73-12.18,6.79l-.14-.07.7-5.95h-5.25l-5.6,31.71h6.37l1.96-11.13c2.17-12.32,8.12-16.1,12.95-16.1,2.52,0,3.71,1.82,3.71,3.85,0,.35,0,.63-.07.98l-3.92,22.4h6.37l3.92-22.26c.07-.56.14-1.12.14-1.61M906.98,276.09l-1.61,8.82c-1.54,8.26-7.21,13.3-11.34,13.3-3.01,0-4.97-1.75-4.97-5.6,0-9.52,7.63-16.66,15.47-16.66,1.05,0,1.96.07,2.45.14M914.19,271.33c-2.03-.35-5.18-.63-9.1-.63-10.78,0-22.4,8.19-22.4,22.33,0,6.79,4.9,10.43,10.01,10.43,4.34,0,8.61-1.68,11.27-6.79l.14.07-.7,5.95h5.25l5.53-31.36ZM875.05,278.75c0-5.11-4.41-8.54-8.82-8.54-5.95,0-9.94,3.36-12.32,6.86l-.14-.07v-.63c0-3.85-4.13-6.16-7.56-6.16-5.88,0-8.54,2.73-11.34,6.79l-.14-.07.7-5.95h-5.25l-5.6,31.71h6.37l1.96-11.13c2.17-12.32,7.49-16.1,12.32-16.1,2.45,0,3.43,1.75,3.43,3.71-.07.35-.07.77-.14,1.12l-3.92,22.4h6.37l1.96-11.13c2.17-12.32,7.49-16.1,12.32-16.1,2.45,0,3.43,1.75,3.43,3.71-.07.35-.07.77-.14,1.12l-3.92,22.4h6.37l3.92-22.26c.07-.56.14-1.12.14-1.68M819.31,270.98h-6.37l-1.96,11.13c-2.17,12.32-8.12,16.1-12.95,16.1-2.52,0-3.71-1.82-3.71-3.85,0-.35,0-.63.07-.98l3.92-22.4h-6.37l-3.92,22.26c-.07.56-.14,1.12-.14,1.61,0,5.18,4.48,8.61,8.96,8.61,6.16,0,9.38-2.73,12.18-6.79l.14.07-.7,5.95h5.25l5.6-31.71ZM779.53,278.82c0-5.18-4.48-8.61-8.96-8.61-6.16,0-9.03,2.73-11.34,5.67l-.14-.07,4.2-22.96h-6.37l-8.82,49.84h6.37l1.96-11.13c2.17-12.32,8.12-16.1,12.95-16.1,2.52,0,3.71,1.75,3.71,3.78,0,.35,0,.7-.07,1.05l-3.92,22.4h6.37l3.92-22.26c.07-.56.14-1.12.14-1.61M719.18,271.61c-1.33-.7-4.2-1.4-7.14-1.4-6.3,0-12.39,3.64-12.39,10.78,0,3.85,2.17,6.37,7.77,8.47,2.03.77,2.73,1.96,2.73,3.36,0,3.22-2.87,5.25-6.79,5.25-3.43,0-5.88-.7-8.12-2.1v6.02c2.1.98,4.34,1.47,7.49,1.47,8.54,0,13.86-5.11,13.86-11.06,0-4.27-2.1-6.79-8.12-9.03-1.89-.7-2.73-1.68-2.73-3.29,0-2.66,2.66-4.76,5.95-4.76,2.8,0,4.97.42,6.37,1.19l1.12-4.9ZM683.46,283.79c0,7.63-6.23,14.07-12.39,14.07-4.41,0-7.14-2.59-7.14-7.98,0-7.56,6.16-14.07,12.39-14.07,4.34,0,7.14,2.66,7.14,7.98M689.9,283.23c0-8.19-5.39-13.02-12.95-13.02-10.43,0-19.53,9.03-19.53,20.3,0,8.19,5.39,12.95,12.95,12.95,10.43,0,19.53-8.96,19.53-20.23M650.82,271.61c-1.33-.7-4.2-1.4-7.14-1.4-6.3,0-12.39,3.64-12.39,10.78,0,3.85,2.17,6.37,7.77,8.47,2.03.77,2.73,1.96,2.73,3.36,0,3.22-2.87,5.25-6.79,5.25-3.43,0-5.88-.7-8.12-2.1v6.02c2.1.98,4.34,1.47,7.49,1.47,8.54,0,13.86-5.11,13.86-11.06,0-4.27-2.1-6.79-8.12-9.03-1.89-.7-2.73-1.68-2.73-3.29,0-2.66,2.66-4.76,5.95-4.76,2.8,0,4.97.42,6.37,1.19l1.12-4.9ZM624.63,275.88l-1.26-5.32c-5.81,0-10.57,3.22-12.53,9.17l-.14-.07,1.12-8.68h-5.25l-5.6,31.71h6.3l1.61-9.17c1.96-11.34,8.96-17.64,14.35-17.64h1.4ZM595,270.98h-6.37l-1.96,11.13c-2.17,12.32-8.12,16.1-12.95,16.1-2.52,0-3.71-1.82-3.71-3.85,0-.35,0-.63.07-.98l3.92-22.4h-6.37l-3.92,22.26c-.07.56-.14,1.12-.14,1.61,0,5.18,4.48,8.61,8.96,8.61,6.16,0,9.38-2.73,12.18-6.79l.14.07-.7,5.95h5.25l5.6-31.71ZM558.16,270.77c-1.4-.42-3.22-.56-5.04-.56-11.13,0-22.61,8.61-22.61,21,0,8.4,6.93,12.25,12.67,12.25,3.92,0,7.14-.84,9.38-2.73l1.54-6.72c-2.59,2.59-6.44,3.85-9.87,3.85-4.34,0-7.21-3.08-7.21-7.28,0-7.42,7.49-14.91,15.61-14.91,1.96,0,3.01,0,4.41.35l1.12-5.25ZM517.54,278.96c0,3.64-6.65,7.84-15.47,7.84,1.26-7.07,7.84-10.99,12.18-10.99,2.59,0,3.29,1.4,3.29,3.15M523.91,277.98c0-4.55-3.22-7.77-9.1-7.77-9.1,0-19.67,8.19-19.67,19.74,0,8.75,5.81,13.51,13.86,13.51,2.94,0,6.09-.77,8.19-2.17l1.61-6.86c-2.59,2.17-5.88,3.43-9.31,3.43-4.69,0-7.28-2.52-7.7-6.09,12.32,0,22.12-5.04,22.12-13.79M490.3,275.88l-1.26-5.32c-5.81,0-10.57,3.22-12.53,9.17l-.14-.07,1.12-8.68h-5.25l-5.6,31.71h6.3l1.61-9.17c1.96-11.34,8.96-17.64,14.35-17.64h1.4ZM1178.68,221.77V85.77c0-4.45,1.55-8.18,4.63-11.27,3.09-3.09,6.86-4.63,11.27-4.63h15.45v56.52h62.7v-56.52h31.8v151.9h-31.8v-67.56h-62.7v67.56h-31.35ZM1154.52,211.59c-.3-1.73-.45-3.66-.45-5.73v-5.72l-.9-18.13c-.57-10.59-2.19-18.09-4.86-22.5-2.64-4.71-7.35-8.25-14.13-10.62,7.69-2.64,13.26-6.9,16.8-12.77,4.11-6.22,6.18-14.02,6.18-23.44,0-14.13-4.14-24.87-12.36-32.22-7.95-7.09-20.16-10.59-36.66-10.59h-57.84c-4.41,0-8.18,1.55-11.27,4.64-3.09,3.09-4.64,6.82-4.64,11.27v136h31.36v-59.16h33.12c8.25,0,13.98,1.62,17.22,4.86,2.94,3.8,4.71,10.14,5.31,18.95l.41,16.35c0,1.77.3,5.01.91,9.72.3,3.24,1.17,6.33,2.64,9.27h34.44c-2.64-1.47-4.4-4.86-5.27-10.18M1120.05,131.25c-3.81,3.24-9.69,4.86-17.64,4.86h-36.66v-40.2h38.43c7.05,0,12.36,1.77,15.87,5.31,3.84,3.24,5.77,8.25,5.77,15s-1.92,11.8-5.77,15.03ZM960.15,69.87h-24.76c-7.35,0-12.36,3.39-15,10.14l-50.34,141.76h33.12l9.72-31.35h59.16l10.18,31.35h33.09l-55.17-151.9ZM921.26,164.79l21.21-64.48,21.18,64.48h-42.4ZM807.31,221.77v-124.96h-45.03v-11.04c0-4.45,1.54-8.18,4.64-11.27,3.09-3.09,6.86-4.63,11.27-4.63h105.09v26.94h-44.61v124.96h-31.36ZM633.89,221.77V85.77c0-4.45,1.54-8.18,4.63-11.27,3.09-3.09,6.86-4.63,11.27-4.63h94.51v26.04h-79.51v32.67h59.2v10.18c0,4.41-1.54,8.18-4.63,11.27-3.09,3.09-6.86,4.64-11.27,4.64h-43.3v38.85h79.51v28.26h-110.41ZM460.89,221.77V85.77c0-4.45,1.54-8.18,4.63-11.27,3.09-3.09,6.86-4.78,11.27-5.08h30.45l30.04,116.14,30.03-116.14h46.39v152.35h-29.16v-122.77l-30.9,122.77h-32.26l-31.35-122.77v122.77h-29.13ZM57.11,282.98c6.46,2.3,9.14,3.16,12.87.85,1.95-1.29,4.22-3.46,7.59-6.79,7.15-7.06,8.68-9.18,7.3-14.57-1.68-3.63-2.92-7.43-3.65-11.32-.05-.24-.08-.49-.13-.73-.2-1.15-.35-2.31-.47-3.47-.03-.32-.07-.65-.1-.97-.1-1.34-.16-2.69-.16-4.03,0-.37.03-.74.04-1.11.03-.96.08-1.92.16-2.88.05-.59.12-1.17.19-1.76.09-.73.21-1.46.33-2.18.46-2.72,1.17-5.41,2.11-8.03.04-.11.07-.22.11-.34h.02c2.37-6.51,6.13-12.62,11.39-17.82.1-.1.21-.19.31-.29,0,0,0,0,0,0,.02-.02.04-.03.06-.05.66-.64,1.34-1.26,2.03-1.85.6-.53,1.22-1.03,1.84-1.52.01,0,.03-.02.04-.03,6.17-4.86,13.29-8.02,20.72-9.42.24-.05.49-.08.73-.13,1.15-.2,2.31-.35,3.47-.47.32-.03.65-.07.97-.1.87-.07,1.74-.08,2.62-.1.23,0,.45-.03.68-.03.1,0,.19,0,.29,0,.15,0,.3-.02.45-.02.06,0,.11,0,.17,0,.05,0,.1,0,.15,0,1.3.01,2.59.07,3.88.18.57.05,1.13.14,1.7.21.68.09,1.35.18,2.03.29.81.13,1.61.29,2.42.46.19.04.38.09.57.14,8.44,1.96,16.43,6.16,22.91,12.73.43.44.82.9,1.23,1.35.43.46.85.92,1.26,1.39.17.2.33.39.49.59,3.96,4.76,6.88,10.1,8.76,15.71h.01c.02.07.04.14.06.2.29.87.56,1.74.8,2.62.2.72.36,1.44.52,2.16.13.6.28,1.19.39,1.79.22,1.2.39,2.41.52,3.61.04.39.07.79.1,1.18.09,1.07.14,2.13.15,3.2,0,.35.02.7.02,1.06,0,1.3-.07,2.59-.18,3.88-.05.57-.14,1.13-.2,1.7-.09.68-.18,1.35-.29,2.03-.13.81-.29,1.61-.46,2.42-.04.19-.09.38-.14.57-.79,3.41-1.97,6.75-3.51,9.94-.73,2.92-.61,4.95.91,7.4,1.29,1.95,3.46,4.22,6.79,7.6,8.11,8.22,9.7,9.01,17.24,6.49,3.75-1.5,7.63-2.48,11.57-2.99.36-.05.73-.08,1.09-.12,1-.11,2.01-.2,3.01-.24,1.19-.06,2.39-.06,3.58-.03.23,0,.46.02.69.03,5.76.24,11.48,1.52,16.87,3.82,4.18,1.36,6.55,1.58,9.56-.28,1.95-1.29,4.22-3.46,7.59-6.79,8.9-8.79,9.1-9.91,5.8-19.24-1.58-4.45-2.45-9.09-2.67-13.75-.03-.27-.09-.53-.11-.8-.04-.42-.08-.84-.11-1.27-.09-1.15-.15-2.3-.17-3.45,0-.38-.02-.75-.02-1.13,0-1.39.07-2.79.19-4.18.05-.61.14-1.22.22-1.83.09-.73.19-1.45.31-2.17.14-.87.31-1.74.49-2.6.05-.21.1-.41.15-.61,2.08-9.08,6.55-17.66,13.54-24.63,4.13-4.11,8.78-7.35,13.73-9.76,12.4-6.19,26.62-6.98,39.44-2.33,6.88,2.48,9.73,3.4,13.71.93,2.08-1.39,4.49-3.72,8.08-7.3,9.48-9.44,9.69-10.65,6.16-20.68-6.44-18.32-2.19-39.51,12.39-54.04,2.47-2.46,5.15-4.59,7.97-6.43C337.23,42.26,273.26.83,199.33.01,90.46-1.2,1.22,86.08.01,194.94c-.36,32.33,7.09,62.93,20.58,90,11.52-5.54,24.65-6.22,36.51-1.97ZM381.61,195.26c-6.88-2.48-9.73-3.4-13.71-.93-2.08,1.39-4.49,3.72-8.08,7.3-9.48,9.44-9.69,10.65-6.16,20.68,6.44,18.32,2.19,39.51-12.39,54.04-7.41,7.38-16.62,12-26.28,13.83-.26.05-.52.09-.78.14-1.23.21-2.46.38-3.69.5-.35.03-.69.08-1.04.11-.57.04-1.14.04-1.71.07-7.08.77-14.27,0-21.06-2.42-6.46-2.3-9.14-3.16-12.87-.85-1.95,1.29-4.22,3.46-7.6,6.79-7.74,7.63-8.9,9.49-6.9,15.96,1.36,3.2,2.36,6.53,3,9.92.05.24.08.49.13.73.2,1.15.35,2.31.47,3.47.03.32.07.65.1.97.03.37.02.73.04,1.1.02.33.02.66.04.98.02.65.08,1.3.08,1.95,0,.17-.01.33-.02.5-.11,12.31-4.94,24.59-14.39,33.91-6.96,6.87-15.61,11.17-24.68,12.88-.24.05-.49.08-.73.13-1.15.2-2.31.35-3.47.47-.32.03-.65.07-.97.1-1.34.1-2.69.16-4.03.16-.1,0-.2,0-.3-.01-.09,0-.18,0-.27,0-1.3-.01-2.59-.07-3.88-.18-.57-.05-1.13-.14-1.7-.21-.68-.09-1.35-.18-2.02-.29-.81-.13-1.62-.29-2.42-.46-.19-.04-.38-.09-.57-.14-8.44-1.96-16.43-6.16-22.91-12.73-3.83-3.88-6.84-8.25-9.09-12.9-2.56-5.18-4.08-10.7-4.65-16.28,0-.08-.03-.16-.03-.24-.01-.13-.02-.25-.03-.38-.09-.98-.15-1.96-.17-2.95-.01-.35-.05-.71-.05-1.06,0-.35-.02-.7-.02-1.05,0-.31.04-.62.04-.93,0-.15.02-.31.02-.46.03-.83.04-1.66.12-2.48.05-.57.14-1.13.21-1.7.09-.68.18-1.35.29-2.02.13-.81.29-1.62.46-2.42.04-.19.09-.38.14-.57.68-2.93,1.65-5.8,2.88-8.58,1.14-3.72,1.21-5.95-.54-8.77-1.29-1.95-3.46-4.22-6.79-7.59-7.72-7.82-9.52-8.92-16.16-6.84-5.48,2.3-11.26,3.55-17.07,3.71-1.06.04-2.11.05-3.17.03-.11,0-.22-.01-.32-.01-6.19-.2-12.35-1.59-18.11-4.17-3.57-1.06-5.76-1.09-8.52.61-1.95,1.29-4.22,3.46-7.6,6.79-8.9,8.79-9.1,9.91-5.8,19.24,5.11,14.42,3,30.74-6.07,43.61,32.04,23.47,71.44,37.51,114.18,37.99,108.87,1.21,198.1-86.06,199.31-194.93,0-.45,0-.89,0-1.33-4.29-.37-8.54-1.24-12.64-2.73Z"
];

const LOGO_DATA_URI = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1304.54 394.27">' + LOGO_PATHS.map(p => '<path fill="white" d="' + p + '" />').join('') + '</svg>');

const LogoHeader = () => (
  <svg width="32" height="32" viewBox="0 0 237.39 237.4">
    <path fill={BRAND_COLOR} d="M34.39,170.39c3.89,1.38,5.5,1.9,7.75.51,1.18-.78,2.54-2.08,4.57-4.09,4.31-4.25,5.23-5.53,4.39-8.77-1.01-2.19-1.76-4.47-2.2-6.81-.03-.15-.05-.29-.08-.44-.12-.69-.21-1.39-.28-2.09-.02-.2-.04-.39-.06-.58-.06-.81-.1-1.62-.09-2.43,0-.22.02-.44.03-.67.02-.58.05-1.16.1-1.73.03-.35.07-.71.11-1.06.06-.44.13-.88.2-1.31.28-1.64.71-3.25,1.27-4.84.02-.07.04-.14.07-.2h0c1.43-3.92,3.69-7.6,6.86-10.73.06-.06.12-.11.18-.17,0,0,0,0,0,0,.01-.01.02-.02.04-.03.4-.39.81-.76,1.22-1.12.36-.32.73-.62,1.11-.92,0,0,.02-.01.02-.02,3.71-2.93,8-4.83,12.47-5.67.15-.03.29-.05.44-.08.69-.12,1.39-.21,2.09-.28.2-.02.39-.04.58-.06.52-.04,1.05-.05,1.58-.06.14,0,.27-.02.41-.02.06,0,.12,0,.17,0,.09,0,.18-.01.27-.01.03,0,.07,0,.1,0,.03,0,.06,0,.09,0,.78,0,1.56.04,2.34.11.34.03.68.08,1.02.12.41.05.82.11,1.22.18.49.08.97.17,1.46.28.12.03.23.06.34.08,5.08,1.18,9.89,3.71,13.79,7.66.26.26.49.54.74.81.26.28.51.55.76.84.1.12.2.24.3.36,2.39,2.86,4.14,6.08,5.27,9.46h0s.02.08.03.12c.17.52.34,1.05.48,1.58.12.43.22.87.32,1.3.08.36.17.72.23,1.08.13.72.23,1.45.31,2.18.03.24.04.47.06.71.05.64.08,1.28.09,1.93,0,.21.01.42.01.64,0,.78-.04,1.56-.11,2.34-.03.34-.08.68-.12,1.02-.05.41-.11.82-.18,1.22-.08.49-.17.97-.28,1.46-.03.12-.06.23-.08.34-.48,2.06-1.19,4.06-2.11,5.99-.44,1.76-.37,2.98.55,4.46.78,1.18,2.08,2.54,4.09,4.57,4.88,4.95,5.84,5.43,10.38,3.91,2.26-.9,4.6-1.5,6.96-1.8.22-.03.44-.05.66-.07.6-.06,1.21-.12,1.81-.15.72-.03,1.44-.04,2.16-.02.14,0,.28.01.42.02,3.47.15,6.91.92,10.16,2.3,2.52.82,3.94.95,5.76-.17,1.18-.78,2.54-2.08,4.57-4.09,5.36-5.29,5.48,5.97,3.49-11.58-.95-2.68-1.48-5.47-1.6-8.28-.02-.16-.05-.32-.07-.48-.03-.25-.05-.51-.07-.76-.06-.69-.09-1.38-.1-2.08,0-.23-.01-.45-.01-.68,0-.84.04-1.68.12-2.51.03-.37.09-.73.13-1.1.05-.44.11-.87.19-1.31.09-.52.18-1.05.3-1.57.03-.12.06-.25.09-.37,1.25-5.46,3.94-10.63,8.15-14.83,2.49-2.48,5.29-4.42,8.27-5.88,7.47-3.73,16.03-4.2,23.75-1.41,4.14,1.49,5.86,2.05,8.25.56,1.25-.83,2.71-2.24,4.87-4.39,5.71-5.69,5.83-6.41,3.71-12.45-3.88-11.03-1.32-23.79,7.46-32.54,1.49-1.48,3.1-2.76,4.8-3.87C203.05,25.45,164.54.5,120.02,0,54.47-.72.74,51.83,0,117.38c-.22,19.47,4.27,37.89,12.39,54.19,6.94-3.33,14.84-3.75,21.99-1.18Z" />
    <path fill={BRAND_COLOR} d="M229.78,117.57c-4.14-1.49-5.86-2.05-8.25-.56-1.25.83-2.71,2.24-4.87,4.39-5.71,5.69-5.83,6.41-3.71,12.45,3.88,11.03,1.32,23.79-7.46,32.54-4.46,4.45-10.01,7.23-15.82,8.33-.16.03-.31.05-.47.08-.74.13-1.48.23-2.22.3-.21.02-.41.05-.62.06-.34.03-.69.02-1.03.04-4.26.47-8.59,0-12.68-1.46-3.89-1.38-5.5-1.9-7.75-.51-1.18.78-2.54,2.08-4.57,4.09-4.66,4.6-5.36,5.71-4.16,9.61.82,1.93,1.42,3.93,1.81,5.97.03.15.05.29.08.44.12.69.21,1.39.28,2.09.02.2.04.39.06.59.02.22.01.44.03.66.01.2.01.39.02.59.01.39.05.78.05,1.17,0,.1,0,.2-.01.3-.07,7.41-2.98,14.8-8.67,20.42-4.19,4.14-9.4,6.73-14.86,7.75-.15.03-.29.05-.44.08-.69.12-1.39.21-2.09.28-.2.02-.39.04-.59.06-.81.06-1.62.1-2.43.09-.06,0-.12,0-.18,0-.05,0-.11,0-.16,0-.78,0-1.56-.04-2.34-.11-.34-.03-.68-.08-1.02-.12-.41-.05-.81-.11-1.22-.17-.49-.08-.97-.17-1.46-.28-.12-.03-.23-.06-.34-.08-5.08-1.18-9.89-3.71-13.79-7.66-2.31-2.34-4.12-4.97-5.47-7.77-1.54-3.12-2.45-6.44-2.8-9.81,0-.05-.02-.09-.02-.14,0-.08-.01-.15-.02-.23-.05-.59-.09-1.18-.1-1.78,0-.21-.03-.42-.03-.64,0-.21-.01-.42-.01-.63,0-.19.02-.37.03-.56,0-.09,0-.19.01-.28.02-.5.03-1,.07-1.5.03-.34.08-.68.12-1.02.05-.41.11-.81.17-1.22.08-.49.17-.97.28-1.46.03-.12.06-.23.08-.34.41-1.76.99-3.49,1.73-5.17.68-2.24.73-3.58-.32-5.28-.78-1.18-2.08-2.54-4.09-4.57-4.65-4.71-5.73-5.37-9.73-4.12-3.3,1.39-6.78,2.14-10.28,2.24-.64.03-1.27.03-1.91.02-.06,0-.13,0-.19,0-3.73-.12-7.44-.96-10.91-2.51-2.15-.64-3.47-.66-5.13.37-1.18.78-2.54,2.08-4.57,4.09-5.36,5.29-5.48,5.97-3.49,11.58,3.08,8.68,1.8,18.51-3.66,26.26,19.29,14.13,43.01,22.59,68.75,22.87,65.55.73,119.28-51.82,120.01-117.37,0-.27,0-.54,0-.8-2.58-.23-5.14-.75-7.61-1.64Z" />
  </svg>
);

const FooterLogo = () => (
  <svg width="240" height="72" viewBox="0 0 1304.54 394.27">
    {LOGO_PATHS.map((p, i) => (
      <path key={i} fill="white" d={p} />
    ))}
  </svg>
);

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const App: React.FC = () => {
  const [data, setData] = useState<TicketData[]>([]);
  const [view, setView] = useState<'dashboard' | 'table' | 'insights' | 'agents'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'FRESH' | 'BLIP'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [selectedQueue, setSelectedQueue] = useState<string>('ALL');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // IA State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const parsed = parseCSVData(text);
          if (parsed && parsed.length > 0) {
            setData(parsed);
            setCurrentPage(1);
            setAiAnalysis(null);
          } else {
            alert("Nenhum registro válido encontrado no CSV.");
          }
        } catch (err) {
          console.error(err);
          alert("Erro ao processar o arquivo. Verifique o formato.");
        }
      };
      reader.readAsText(file);
    }
  };





  const exportToPDF = async () => {
    if (!dashboardRef.current || data.length === 0) return;
    setIsExporting(true);

    try {
      // Small delay to ensure render stability
      await new Promise(resolve => setTimeout(resolve, 800));

      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // Retain high quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc' // Match app background
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const margin = 10;
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      const headerHeight = 35; // Header space for first page

      // Draw Header Function
      const drawHeader = (doc: any) => {
        doc.setFillColor(63, 38, 102);
        doc.rect(0, 0, pdfWidth, headerHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Análise de Indicadores de Atendimento', margin, 18);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 26);
      };

      // Page 1
      // Page 1
      drawHeader(pdf);
      position = headerHeight + 5; // Start below header

      // Use JPEG with 0.8 quality for significant size reduction
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - position - margin); // Decrement used height

      // Subsequent Pages
      while (heightLeft > 0) {
        position -= (pdfHeight - margin); // Shift up
        pdf.addPage();
        drawHeader(pdf); // Header on all pages
        // We shift the image up so the next chunk is visible
        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - (margin * 2));
      }

      // Add Footer on the last page or all pages? Let's add simple page numbers for now
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Página ' + i + ' de ' + pageCount, pdf.internal.pageSize.width - margin, pdf.internal.pageSize.height - 10, { align: 'right' });
      }

      pdf.save(`relatorio-atendimento-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const years = useMemo(() => {
    const y = new Set<string>();
    data.forEach(d => d.dataObj && y.add(d.dataObj.getFullYear().toString()));
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [data]);

  const categoriesList = useMemo(() => {
    const c = new Set<string>();
    data.forEach(d => d.categoria && c.add(d.categoria));
    return Array.from(c).sort();
  }, [data]);

  const agentsList = useMemo(() => {
    const a = new Set<string>();
    data.forEach(d => d.agente && a.add(d.agente));
    return Array.from(a).sort();
  }, [data]);

  const queuesList = useMemo(() => {
    const q = new Set<string>();
    data.forEach(d => d.fila && q.add(d.fila));
    return Array.from(q).sort();
  }, [data]);

  const dataFilteredForClients = useMemo(() => {
    return data.filter(d => {
      const matchesSearch = (d.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) || d.agente.toLowerCase().includes(searchTerm.toLowerCase()) || d.numeroTicket.includes(searchTerm);
      const matchesPlatform = platformFilter === 'ALL' || d.plataforma === platformFilter;
      const matchesCategory = selectedCategory === 'ALL' || d.categoria === selectedCategory;
      const matchesAgent = selectedAgent === 'ALL' || d.agente === selectedAgent;
      const matchesQueue = selectedQueue === 'ALL' || d.fila === selectedQueue;
      const matchesYear = selectedYear === 'ALL' || d.dataObj.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.dataObj.getMonth().toString() === selectedMonth;

      const ticketDate = d.dataObj;
      const start = dateStart ? new Date(dateStart + 'T00:00:00') : null;
      const end = dateEnd ? new Date(dateEnd + 'T23:59:59') : null;
      const matchesDate = (!start || ticketDate >= start) && (!end || ticketDate <= end);

      return matchesSearch && matchesPlatform && matchesCategory && matchesAgent && matchesQueue && matchesDate && matchesYear && matchesMonth;
    });
  }, [data, searchTerm, platformFilter, selectedCategory, selectedAgent, selectedQueue, dateStart, dateEnd, selectedYear, selectedMonth]);

  const top10Clients = useMemo(() => {
    const clientCount: Record<string, number> = {};
    dataFilteredForClients.forEach(d => {
      if (d.cliente) {
        clientCount[d.cliente] = (clientCount[d.cliente] || 0) + 1;
      }
    });
    return Object.entries(clientCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [dataFilteredForClients]);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const matchesSearch = d.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || d.agente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'ALL' || d.plataforma === platformFilter;
      const matchesCategory = selectedCategory === 'ALL' || d.categoria === selectedCategory;
      const matchesAgent = selectedAgent === 'ALL' || d.agente === selectedAgent;
      const matchesQueue = selectedQueue === 'ALL' || d.fila === selectedQueue;
      const matchesClient = selectedClient === 'ALL' || d.cliente === selectedClient;
      const matchesYear = selectedYear === 'ALL' || d.dataObj.getFullYear().toString() === selectedYear;
      const matchesMonth = selectedMonth === 'ALL' || d.dataObj.getMonth().toString() === selectedMonth;

      const ticketDate = d.dataObj;
      const start = dateStart ? new Date(dateStart + 'T00:00:00') : null;
      const end = dateEnd ? new Date(dateEnd + 'T23:59:59') : null;
      const matchesDate = (!start || ticketDate >= start) && (!end || ticketDate <= end);

      return matchesSearch && matchesPlatform && matchesCategory && matchesAgent && matchesQueue && matchesClient && matchesDate && matchesYear && matchesMonth;
    });
  }, [data, searchTerm, platformFilter, selectedCategory, selectedAgent, selectedQueue, selectedClient, dateStart, dateEnd, selectedYear, selectedMonth]);

  const heatmapData = useMemo(() => {
    // 7 days x 24 hours
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    let max = 0;
    let peakDay = 0;
    let peakHour = 0;

    filteredData.forEach(d => {
      if (!d.dataObj) return;
      const day = d.dataObj.getDay(); // 0 = Dom, 6 = Sab
      // Ajustar para 0=Seg, ..., 6=Dom
      const adjDay = day === 0 ? 6 : day - 1;
      const hour = d.dataObj.getHours();

      grid[adjDay][hour]++;
      if (grid[adjDay][hour] > max) {
        max = grid[adjDay][hour];
        peakDay = adjDay;
        peakHour = hour;
      }
    });

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return { grid, max, peak: { day: days[peakDay], hour: peakHour, count: max } };
  }, [filteredData]);

  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Filtrar apenas registros com tempos válidos (não zerados)
    const validAHT = filteredData.filter(d => d.ahtSeconds > 0);
    const validFRT = filteredData.filter(d => d.frtSeconds > 0);

    let totalAHT = 0;
    let totalFRT = 0;
    const categoriesMap: Record<string, { total: number; FRESH: number; BLIP: number; totalAHT: number }> = {};
    const agents: Record<string, { count: number; FRESH: number; BLIP: number }> = {};

    filteredData.forEach(d => {
      if (!categoriesMap[d.categoria]) categoriesMap[d.categoria] = { total: 0, FRESH: 0, BLIP: 0, totalAHT: 0 };
      categoriesMap[d.categoria].total++;
      categoriesMap[d.categoria].totalAHT += d.ahtSeconds;
      if (d.plataforma === 'FRESH') categoriesMap[d.categoria].FRESH++;
      if (d.plataforma === 'BLIP') categoriesMap[d.categoria].BLIP++;
      if (!agents[d.agente]) agents[d.agente] = { count: 0, FRESH: 0, BLIP: 0 };
      agents[d.agente].count++;
      if (d.plataforma === 'FRESH') agents[d.agente].FRESH++;
      if (d.plataforma === 'BLIP') agents[d.agente].BLIP++;
    });

    validAHT.forEach(d => totalAHT += d.ahtSeconds);
    validFRT.forEach(d => totalFRT += d.frtSeconds);

    return {
      total: filteredData.length,
      avgAHT: validAHT.length > 0 ? totalAHT / validAHT.length : 0,
      avgFRT: validFRT.length > 0 ? totalFRT / validFRT.length : 0,
      categories: Object.entries(categoriesMap).map(([name, val]) => ({
        name,
        value: val.total,
        FRESH: val.FRESH,
        BLIP: val.BLIP,
        totalAHT: val.totalAHT
      })).sort((a, b) => b.value - a.value),
      agents: Object.entries(agents).map(([name, val]) => ({
        name,
        Freshdesk: val.FRESH,
        Blip: val.BLIP,
        total: val.count
      })).sort((a, b) => b.total - a.total)
    };
  }, [filteredData]);

  const monthlyEvolutionData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const grouped = months.map(m => ({ name: m, FRESH_count: 0, BLIP_count: 0 }));
    filteredData.forEach(d => {
      const monthIdx = d.dataObj.getMonth();
      if (d.plataforma === 'FRESH') grouped[monthIdx].FRESH_count++;
      else grouped[monthIdx].BLIP_count++;
    });
    return grouped;
  }, [filteredData]);

  // Registros incompletos
  const incompleteRecords = useMemo(() => {
    return filteredData.filter(d =>
      !d.fila || !d.categoria || !d.agente || d.ahtSeconds === 0 || d.frtSeconds === 0
    );
  }, [filteredData]);

  // Métricas por fila
  const queueMetrics = useMemo(() => {
    const queues: Record<string, { total: number; FRESH: number; BLIP: number }> = {};
    filteredData.forEach(d => {
      if (d.fila) {
        if (!queues[d.fila]) queues[d.fila] = { total: 0, FRESH: 0, BLIP: 0 };
        queues[d.fila].total++;
        if (d.plataforma === 'FRESH') queues[d.fila].FRESH++;
        if (d.plataforma === 'BLIP') queues[d.fila].BLIP++;
      }
    });
    return Object.entries(queues)
      .map(([name, val]) => ({ name, total: val.total, FRESH: val.FRESH, BLIP: val.BLIP }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  // Performance de agentes (para nova aba)
  const agentPerformance = useMemo(() => {
    const agentStats: Record<string, {
      total: number;
      validAHT: number[];
      validFRT: number[];
      csatScores: number[];
    }> = {};

    filteredData.forEach(d => {
      if (!agentStats[d.agente]) {
        agentStats[d.agente] = { total: 0, validAHT: [], validFRT: [], csatScores: [] };
      }
      agentStats[d.agente].total++;
      if (d.ahtSeconds > 0) agentStats[d.agente].validAHT.push(d.ahtSeconds);
      if (d.frtSeconds > 0) agentStats[d.agente].validFRT.push(d.frtSeconds);
      if (d.csat > 0) agentStats[d.agente].csatScores.push(d.csat);
    });

    return Object.entries(agentStats).map(([name, stats]) => ({
      name,
      total: stats.total,
      avgAHT: stats.validAHT.length > 0
        ? stats.validAHT.reduce((a, b) => a + b, 0) / stats.validAHT.length
        : 0,
      avgFRT: stats.validFRT.length > 0
        ? stats.validFRT.reduce((a, b) => a + b, 0) / stats.validFRT.length
        : 0,
      avgCSAT: stats.csatScores.length > 0
        ? stats.csatScores.reduce((a, b) => a + b, 0) / stats.csatScores.length
        : 0,
      csatCount: stats.csatScores.length
    }))
      .filter(a => a.avgAHT > 0)
      .sort((a, b) => a.avgAHT - b.avgAHT); // Mais rápido primeiro
  }, [filteredData]);

  const generateAIInsights = async () => {
    if (filteredData.length === 0) return;
    setIsGeneratingInsights(true);

    try {
      // Usar a chave de API do ambiente
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('API Key não configurada. Verifique se o arquivo .env contém VITE_GEMINI_API_KEY');
      }

      const genAI = new GoogleGenAI(apiKey);

      // Encontrar categoria que consome mais tempo médio
      const catTimeSorted = [...(metrics?.categories || [])].sort((a, b) => (b.totalAHT / b.value) - (a.totalAHT / a.value));
      const topTimeCat = catTimeSorted[0];

      // Top 3 Agentes
      const topAgents = metrics?.agents.slice(0, 3).map(a => `${a.name} (${a.total})`).join(', ');

      // Periodo
      const dates = filteredData.map(d => d.dataObj.getTime());
      const minDate = new Date(Math.min(...dates) || Date.now()).toLocaleDateString('pt-BR');
      const maxDate = new Date(Math.max(...dates) || Date.now()).toLocaleDateString('pt-BR');

      const summary = `
        Contexto: Análise de Atendimento (Freshdesk vs Blip)
        Período Analisado: ${minDate} a ${maxDate}
        Total Tickets Filtrados: ${filteredData.length}
        TMA Geral: ${metrics ? formatSecondsToTime(metrics.avgAHT) : 'N/A'}
        
        Agentes Destaque (Volume): ${topAgents}
        Categoria Maior Volumetria: ${metrics?.categories[0]?.name} (${metrics?.categories[0]?.value} tickets)
        Categoria Maior Tempo (Média): ${topTimeCat?.name} (${formatSecondsToTime(topTimeCat?.totalAHT / topTimeCat?.value)})
        
        Pico de Atendimento (Heatmap): ${heatmapData.peak.day} às ${heatmapData.peak.hour}h (${heatmapData.peak.count} tickets)
      `;

      const prompt = `Como um Especialista em Operações de Suporte e Customer Experience, analise estes dados e gere um relatório executivo estratégico.

      IMPORTANTE: Responda APENAS com um JSON válido (sem markdown code blocks) seguindo EXATAMENTE esta estrutura:
      {
        "period_analysis": "Texto resumido sobre o volume e demanda do período",
        "team_performance": "Análise sobre os agentes destaque e distribuição",
        "bottlenecks": "Explicação sobre a categoria mais demorada e impacto",
        "heatmap_analysis": "Análise do horário de pico e sugestão de escala",
        "action_plan": ["Ação 1 curta e direta", "Ação 2 curta e direta", "Ação 3 curta e direta"]
      }

      Dados para análise: ${summary}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Remover code blocks se a IA colocá-los
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const json = JSON.parse(cleanJson);
        setAiAnalysis(json);
      } catch (e) {
        console.error("JSON Parse Error", e);
        console.log("Resposta recebida:", text);
        setAiAnalysis({
          period_analysis: "Não foi possível estruturar a análise. Tente novamente.",
          team_performance: "-",
          bottlenecks: "-",
          heatmap_analysis: "-",
          action_plan: ["Erro na geração. Verifique os dados."]
        });
      }
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      const errorMsg = err?.message || 'Erro desconhecido';
      alert(`Erro ao conectar com a IA: ${errorMsg}\n\nVerifique:\n1. Se a chave de API está correta\n2. Se você reiniciou o servidor após alterar o .env\n3. Se a chave tem permissões para usar a API Gemini`);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Aplicar filtro de incompletos se ativado
  const displayData = showOnlyIncomplete
    ? filteredData.filter(d => !d.fila || !d.categoria || !d.agente || d.ahtSeconds === 0 || d.frtSeconds === 0)
    : filteredData;

  const paginatedData = displayData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(displayData.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoHeader />
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">Análise de Indicadores de Atendimento</h1>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Dashboard Executivo</p>
            </div>
          </div>
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-white text-[#3f2666] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button onClick={() => setView('agents')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'agents' ? 'bg-white text-[#3f2666] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Users size={14} /> Agentes
            </button>
            <button onClick={() => setView('table')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'table' ? 'bg-white text-[#3f2666] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Database size={14} /> Base Analítica
            </button>
            <button onClick={() => setView('insights')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'insights' ? 'bg-white text-[#3f2666] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Sparkles size={14} className={view === 'insights' ? 'text-[#3f2666]' : 'text-amber-500'} /> Insights IA
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <button disabled={isExporting || data.length === 0} onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-slate-50 disabled:opacity-50">
              {isExporting ? <div className="loader"></div> : <Download size={14} />} Exportar PDF
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-[#3f2666] text-white rounded-lg text-xs font-black hover:opacity-90 shadow-sm">
              <Upload size={14} /> Importar CSV
            </button>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-100 px-6 py-2 sticky top-[64px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-slate-400" />
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-[#3f2666]" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as any)}>
            <option value="ALL">Plataformas: Todas</option>
            <option value="BLIP">Blip</option>
            <option value="FRESH">Freshdesk</option>
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedQueue} onChange={(e) => setSelectedQueue(e.target.value)}>
            <option value="ALL">Filas: Todas</option>
            {queuesList.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="ALL">Agentes: Todos</option>
            {agentsList.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="ALL">Categorias: Todas</option>
            {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="ALL">Anos: Todos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="ALL">Mês: Todos</option>
            {MONTHS.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
          </select>
          <select className="text-[11px] font-bold border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-slate-600" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
            <option value="ALL">Clientes: Todos</option>
            <option value="ALL" disabled>--- Top 10 ---</option>
            {top10Clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 ml-auto">
            <Calendar size={12} className="text-slate-400" />
            <input type="date" className="bg-transparent text-[10px] font-bold outline-none" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            <span className="text-slate-300">-</span>
            <input type="date" className="bg-transparent text-[10px] font-bold outline-none" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
        </div>
      </div>

      <main ref={dashboardRef} className="max-w-7xl mx-auto px-6 mt-8 flex-grow w-full">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <Upload size={48} className="text-[#3f2666]/10 mb-6" />
            <h2 className="text-xl font-black text-slate-800">Aguardando Importação</h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">Carregue um arquivo CSV para começar a análise.</p>
          </div>
        ) : view === 'dashboard' ? (
          <div className="space-y-8 pb-12">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard title="Total Tickets" value={filteredData.length} icon={<Ticket className="text-[#3f2666]" size={18} />} subValue="Volume processado" />
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Filas Ativas</p>
                    <h4 className="text-3xl font-black text-slate-800 mt-1">{queueMetrics.length}</h4>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Tag className="text-purple-500" size={18} />
                  </div>
                </div>
                <div className="space-y-2 mt-auto max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {queueMetrics.map((q, i) => (
                    <div key={i} className="flex justify-between items-center text-[10px] border-b border-slate-50 last:border-0 pb-1">
                      <span className="font-bold text-slate-600 truncate max-w-[100px]" title={q.name}>{q.name}</span>
                      <span className="text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded">{q.total}</span>
                    </div>
                  ))}
                </div>
              </div>
              <StatCard title="TMA Médio" value={metrics ? formatSecondsToTime(metrics.avgAHT) : '00:00:00'} icon={<Clock className="text-emerald-500" size={18} />} subValue="Tempo Atendimento" />
              <StatCard title="TMR Médio" value={metrics ? formatSecondsToTime(metrics.avgFRT) : '00:00:00'} icon={<Activity className="text-blue-500" size={18} />} subValue="Tempo Resposta" />
              <StatCard title="Agentes" value={metrics ? metrics.agents.length : 0} icon={<Users className="text-amber-500" size={18} />} subValue="Ativos no período" />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <TrendingUp size={16} /> Evolução Mensal de Volume
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="FRESH_count" name="Freshdesk" stroke={FRESH_COLOR} fill={FRESH_COLOR} fillOpacity={0.1} strokeWidth={3} hide={platformFilter === 'BLIP'} />
                      <Area type="monotone" dataKey="BLIP_count" name="Blip" stroke={BLIP_COLOR} fill={BLIP_COLOR} fillOpacity={0.1} strokeWidth={3} hide={platformFilter === 'FRESH'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={14} /> Mapa de Calor Semanal
                </h3>
                <div className="flex flex-col gap-1">
                  <div className="flex text-[9px] text-slate-400 font-bold mb-1 pl-8">
                    <span className="flex-1 text-center">00h</span>
                    <span className="flex-1 text-center">06h</span>
                    <span className="flex-1 text-center">12h</span>
                    <span className="flex-1 text-center">18h</span>
                  </div>
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, dayIdx) => (
                    <div key={d} className="flex items-center gap-1">
                      <div className="w-8 text-[9px] font-bold text-slate-500">{d}</div>
                      <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                        {heatmapData.grid[dayIdx].map((val, hourIdx) => {
                          const opacity = heatmapData.max > 0 ? (val / heatmapData.max) : 0;
                          return (
                            <div
                              key={hourIdx}
                              className="h-6 rounded-sm transition-all hover:scale-125 cursor-help"
                              style={{
                                backgroundColor: BRAND_COLOR,
                                opacity: Math.max(0.05, opacity),
                                flex: 1
                              }}
                              title={`${d} ${hourIdx}h: ${val} tickets`}
                            ></div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[9px] text-slate-400">Menor Volume</span>
                    <div className="flex gap-1">
                      {[0.1, 0.3, 0.6, 1].map(o => <div key={o} style={{ opacity: o }} className="w-4 h-4 bg-[#3f2666] rounded-sm"></div>)}
                    </div>
                    <span className="text-[9px] text-slate-400">Maior Volume</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Performance por Agente (Volume)</h3>
                <div style={{ height: Math.max(400, (metrics?.agents.length || 0) * 35) + 'px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.agents || []} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip />
                      <Bar name="Freshdesk" dataKey="Freshdesk" stackId="a" fill={FRESH_COLOR} barSize={14} hide={platformFilter === 'BLIP'} />
                      <Bar name="Blip" dataKey="Blip" stackId="a" fill={BLIP_COLOR} barSize={14} hide={platformFilter === 'FRESH'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <h3 className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest">Participação por Categoria</h3>
                <div className="flex-1 min-h-[300px]">
                  <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div style={{ height: Math.max(400, (metrics?.categories.length || 0) * 35) + 'px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={metrics?.categories || []}
                          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="value" name="Volume" radius={[0, 4, 4, 0]} barSize={16}>
                            {(metrics?.categories || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : view === 'table' ? (
          <div className="pb-12 animate-in space-y-6">
            {incompleteRecords.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      ⚠️ {incompleteRecords.length} registro{incompleteRecords.length > 1 ? 's' : ''} incompleto{incompleteRecords.length > 1 ? 's' : ''} encontrado{incompleteRecords.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-red-600 mt-1">Registros com dados faltantes estão destacados em vermelho abaixo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowOnlyIncomplete(!showOnlyIncomplete)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${showOnlyIncomplete ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'}`}
                >
                  {showOnlyIncomplete ? '✓ Mostrando Incompletos' : 'Filtrar Incompletos'}
                </button>
              </div>
            )}

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-sm uppercase">Lista Detalhada</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-[#3f2666] bg-[#3f2666]/10 px-3 py-1 rounded-full">{filteredData.length.toLocaleString()} Tickets</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft size={16} /></button>
                    <span className="text-[10px] font-black text-slate-400">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#fcfdfe] text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr><th className="px-6 py-4">ID</th><th className="px-6 py-4">Canal</th><th className="px-6 py-4">Agente</th><th className="px-6 py-4">Categoria</th><th className="px-6 py-4">TMA</th><th className="px-6 py-4">Cliente</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[11px]">
                    {paginatedData.map((ticket, i) => {
                      const isIncomplete = !ticket.fila || !ticket.categoria || !ticket.agente || ticket.ahtSeconds === 0 || ticket.frtSeconds === 0;
                      return (
                        <tr key={i} className={`hover:bg-slate-50 ${isIncomplete ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                          <td className="px-6 py-3 font-mono font-bold text-indigo-600">{ticket.numeroTicket}</td>
                          <td className="px-6 py-3"><span className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-100">{ticket.plataforma}</span></td>
                          <td className={`px-6 py-3 font-bold uppercase ${isIncomplete && !ticket.agente ? 'text-red-600' : 'text-slate-700'}`}>{ticket.agente || '⚠️ FALTANDO'}</td>
                          <td className={`px-6 py-3 italic ${isIncomplete && !ticket.categoria ? 'text-red-600' : 'text-slate-400'}`}>{ticket.categoria || '⚠️ FALTANDO'}</td>
                          <td className={`px-6 py-3 font-mono ${isIncomplete && ticket.ahtSeconds === 0 ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{ticket.ahtOriginal || '⚠️ 0s'}</td>
                          <td className="px-6 py-3 text-slate-400 font-bold truncate max-w-[150px]">{ticket.cliente || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          /* DASHBOARD VIEW + AGENTS VIEW (if exporting) */
          <>
            {(view === 'dashboard' || isExporting) && (
              <div className="space-y-8 pb-12">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <StatCard title="Total Tickets" value={filteredData.length} icon={<Ticket className="text-[#3f2666]" size={18} />} subValue="Volume processado" />
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Filas Ativas</p>
                        <h4 className="text-3xl font-black text-slate-800 mt-1">{queueMetrics.length}</h4>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <Tag className="text-purple-500" size={18} />
                      </div>
                    </div>
                    <div className="space-y-2 mt-auto max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      {queueMetrics.map((q, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] border-b border-slate-50 last:border-0 pb-1">
                          <span className="font-bold text-slate-600 truncate max-w-[100px]" title={q.name}>{q.name}</span>
                          <span className="text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded">{q.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <StatCard title="TMA Médio" value={metrics ? formatSecondsToTime(metrics.avgAHT) : '00:00:00'} icon={<Clock className="text-emerald-500" size={18} />} subValue="Tempo Atendimento" />
                  <StatCard title="TMR Médio" value={metrics ? formatSecondsToTime(metrics.avgFRT) : '00:00:00'} icon={<Activity className="text-blue-500" size={18} />} subValue="Tempo Resposta" />
                  <StatCard title="Agentes" value={metrics ? metrics.agents.length : 0} icon={<Users className="text-amber-500" size={18} />} subValue="Ativos no período" />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <section className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                      <TrendingUp size={16} /> Evolução Mensal de Volume
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyEvolutionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="FRESH_count" name="Freshdesk" stroke={FRESH_COLOR} fill={FRESH_COLOR} fillOpacity={0.1} strokeWidth={3} hide={platformFilter === 'BLIP'} />
                          <Area type="monotone" dataKey="BLIP_count" name="Blip" stroke={BLIP_COLOR} fill={BLIP_COLOR} fillOpacity={0.1} strokeWidth={3} hide={platformFilter === 'FRESH'} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity size={14} /> Mapa de Calor Semanal
                    </h3>
                    <div className="flex flex-col gap-1">
                      <div className="flex text-[9px] text-slate-400 font-bold mb-1 pl-8">
                        <span className="flex-1 text-center">00h</span>
                        <span className="flex-1 text-center">06h</span>
                        <span className="flex-1 text-center">12h</span>
                        <span className="flex-1 text-center">18h</span>
                      </div>
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, dayIdx) => (
                        <div key={d} className="flex items-center gap-1">
                          <div className="w-8 text-[9px] font-bold text-slate-500">{d}</div>
                          <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                            {heatmapData.grid[dayIdx].map((val, hourIdx) => {
                              const opacity = heatmapData.max > 0 ? (val / heatmapData.max) : 0;
                              return (
                                <div
                                  key={hourIdx}
                                  className="h-6 rounded-sm transition-all hover:scale-125 cursor-help"
                                  style={{
                                    backgroundColor: BRAND_COLOR,
                                    opacity: Math.max(0.05, opacity),
                                    flex: 1
                                  }}
                                  title={`${d} ${hourIdx}h: ${val} tickets`}
                                ></div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-[9px] text-slate-400">Menor Volume</span>
                        <div className="flex gap-1">
                          {[0.1, 0.3, 0.6, 1].map(o => <div key={o} style={{ opacity: o }} className="w-4 h-4 bg-[#3f2666] rounded-sm"></div>)}
                        </div>
                        <span className="text-[9px] text-slate-400">Maior Volume</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Performance por Agente (Volume)</h3>
                    <div style={{ height: Math.max(400, (metrics?.agents.length || 0) * 35) + 'px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.agents || []} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 10, fill: '#64748b' }} />
                          <Tooltip />
                          <Bar name="Freshdesk" dataKey="Freshdesk" stackId="a" fill={FRESH_COLOR} barSize={14} hide={platformFilter === 'BLIP'} />
                          <Bar name="Blip" dataKey="Blip" stackId="a" fill={BLIP_COLOR} barSize={14} hide={platformFilter === 'FRESH'} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest">Participação por Categoria</h3>
                    <div className="flex-1 min-h-[300px]">
                      <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                        <div style={{ height: Math.max(400, (metrics?.categories.length || 0) * 35) + 'px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={metrics?.categories || []}
                              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                              />
                              <Bar dataKey="value" name="Volume" radius={[0, 4, 4, 0]} barSize={16}>
                                {(metrics?.categories || []).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(view === 'agents' || isExporting) && (
              <div className={`space-y-8 pb-12 ${isExporting ? 'mt-8 border-t border-slate-200 pt-8' : ''}`}>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Users className="text-purple-600" size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Análise de Performance por Agente</h2>
                      <p className="text-slate-600 text-sm font-medium">Velocidade de atendimento e satisfação do cliente (CSAT)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* TMA por Agente */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} /> Tempo Médio de Atendimento (TMA)
                    </h3>
                    <div style={{ height: Math.max(400, agentPerformance.length * 40) + 'px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agentPerformance} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                                    <p className="font-bold text-slate-800 mb-1">{payload[0].payload.name}</p>
                                    <p className="text-emerald-600 font-mono text-sm">
                                      {formatSecondsToTime(payload[0].value as number)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="avgAHT" radius={[0, 4, 4, 0]} barSize={20}>
                            {agentPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* TMR por Agente */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-400 mb-6 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} /> Tempo Médio de 1ª Resposta (TMR)
                    </h3>
                    <div style={{ height: Math.max(400, agentPerformance.length * 40) + 'px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={agentPerformance} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                                    <p className="font-bold text-slate-800 mb-1">{payload[0].payload.name}</p>
                                    <p className="text-blue-600 font-mono text-sm">
                                      {formatSecondsToTime(payload[0].value as number)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="avgFRT" radius={[0, 4, 4, 0]} barSize={20} fill="#3b82f6" fillOpacity={0.2} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Tabela de Ranking */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ranking de Performance e Satisfação</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 w-16">Rank</th>
                          <th className="px-6 py-4">Agente</th>
                          <th className="px-6 py-4 text-center">Tickets</th>
                          <th className="px-6 py-4">TMA Médio</th>
                          <th className="px-6 py-4">TMR Médio</th>
                          <th className="px-6 py-4 text-center">CSAT (1-5)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {agentPerformance.map((agent, index) => (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${index === 0 ? 'bg-amber-100 text-amber-600' :
                                index === 1 ? 'bg-slate-200 text-slate-600' :
                                  index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                {index + 1}º
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">{agent.name}</td>
                            <td className="px-6 py-4 text-center font-mono text-slate-500">{agent.total}</td>
                            <td className="px-6 py-4 font-mono font-bold text-emerald-600">{formatSecondsToTime(agent.avgAHT)}</td>
                            <td className="px-6 py-4 font-mono text-blue-500">{formatSecondsToTime(agent.avgFRT)}</td>
                            <td className="px-6 py-4 text-center">
                              {agent.csatCount > 0 ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center text-amber-400 gap-0.5">
                                    <span className="font-bold text-slate-700 mr-1">{agent.avgCSAT.toFixed(1)}</span>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <svg key={i} className={`w-3 h-3 ${i < Math.round(agent.avgCSAT) ? 'fill-current' : 'text-slate-200 fill-current'}`} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-slate-400 mt-0.5">({agent.csatCount} avaliações)</span>
                                </div>
                              ) : <span className="text-slate-300">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {isExporting && (
              <div className="mt-12 flex justify-center opacity-50 grayscale">
                <FooterLogo />
              </div>
            )}
          </>
        ) : (
        /* INSIGHTS VIEW */
        <div className="animate-in pb-12 max-w-4xl mx-auto">
          <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120} className="text-[#3f2666]" /></div>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-4 bg-amber-50 rounded-2xl"><Sparkles className="text-amber-500" size={32} /></div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Insights Estratégicos com IA</h2>
                <p className="text-slate-400 text-sm font-medium">Diagnóstico de eficiência e sugestões de melhoria.</p>
              </div>
            </div>
            {!aiAnalysis ? (
              <div className="flex flex-col items-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 relative z-10">
                <Target size={48} className="text-slate-200 mb-6" />
                <p className="text-slate-400 font-bold text-center max-w-sm mb-8">Baseado nos dados atuais, a IA irá gerar um plano de ação para otimizar seus KPIs.</p>
                <button disabled={isGeneratingInsights} onClick={generateAIInsights} className="flex items-center gap-3 px-8 py-4 bg-[#3f2666] text-white rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {isGeneratingInsights ? <><div className="loader border-white border-t-transparent"></div> Analisando Dados...</> : <><Lightbulb size={20} /> Gerar Diagnóstico</>}
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={14} /> Análise de Período</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{aiAnalysis.period_analysis}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Users size={14} /> Performance de Time</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{aiAnalysis.team_performance}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={14} /> Gargalos (Categorias)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{aiAnalysis.bottlenecks}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={14} /> Mapa de Calor</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{aiAnalysis.heatmap_analysis}</p>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-6 flex items-center gap-2"><Target size={18} /> Plano de Ação Recomendado</h3>
                  <div className="grid gap-4">
                    {aiAnalysis.action_plan?.map((action: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">{idx + 1}</div>
                        <p className="text-sm text-slate-700 font-medium pt-1.5">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <button onClick={() => { setAiAnalysis(null); generateAIInsights(); }} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 hover:text-[#3f2666] hover:border-[#3f2666]/20 transition-all">
                    <Target size={16} /> Recalcular Insights
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      <footer className="bg-[#3f2666] py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
          <div className="opacity-90">
            <FooterLogo />
          </div>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ title, value, icon, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">{icon}</div>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800">{value}</p>
    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{subValue}</p>
  </div>
);

export default App;
