import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Code2,
  GraduationCap,
  Database,
  Bug,
  Sparkles,
  Film,
  Briefcase,
  MapPin,
  Mail,
  ExternalLink,
} from 'lucide-react';

const DEVELOPER_IMAGE =
  'https://i.ibb.co/RTddRmJk/Maheswar-Reddy-website.png';

export default function Footer() {
  const [isOpen, setIsOpen] = useState(false);

  const skills = [
    'Full Stack Development',
    'Java',
    'HTML & CSS',
    'JavaScript',
    'React',
    'Node.js',
    'MongoDB',
    'SQL',
    'QA Testing',
    'AI Creations',
    'Video & Photo Editing',
  ];

  return (
    <>
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">

          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} RoomMate Pro. All rights reserved.
          </p>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 rounded-full border border-red-200 bg-white py-2 pl-2 pr-4 shadow-sm transition hover:border-red-400 hover:shadow-md"
            aria-label="View developer profile"
          >
            <img
              src={DEVELOPER_IMAGE}
              alt="Maheswar Reddy"
              className="h-10 w-10 rounded-full border-2 border-red-500 object-cover"
            />

            <span className="text-left">
              <span className="block text-xs font-bold text-slate-800 group-hover:text-red-600">
                Developed by Maheswar Reddy
              </span>

              <span className="block text-[11px] text-slate-500">
                Full Stack Developer · View Profile
              </span>
            </span>

            <Code2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Developer profile"
              initial={{ opacity: 0, scale: 0.85, y: 25 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 25 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-red-500/30 bg-slate-950 shadow-2xl shadow-red-950/40"
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 z-20 rounded-full bg-black/70 p-2 text-white transition hover:bg-red-600"
                aria-label="Close developer profile"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid md:grid-cols-2">

                {/* Developer image */}
                <div className="relative flex items-center justify-center overflow-hidden bg-slate-900">
                  <img
                    src={DEVELOPER_IMAGE}
                    alt="Maheswar Reddy - Full Stack Developer"
                    className="h-full max-h-[620px] w-full object-contain"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-14">
                    <p className="text-2xl font-black text-white">
                      Maheswar <span className="text-red-500">Reddy</span>
                    </p>

                    <p className="mt-1 text-sm font-semibold text-red-300">
                      Full Stack Developer
                    </p>
                  </div>
                </div>

                {/* Developer details */}
                <div className="p-6 text-white sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                    Developer Profile
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Code. Build.
                    <span className="block text-red-500">Create.</span>
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Full Stack Developer interested in web development,
                    software testing, databases and AI-powered creative projects.
                  </p>

                  <div className="mt-6 space-y-4">

                    <div className="flex items-start gap-3">
                      <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Education</p>
                        <p className="text-sm font-semibold">
                          B.Tech – Computer Science
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Location</p>
                        <p className="text-sm font-semibold">
                          Kadapa, Andhra Pradesh
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Code2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Development</p>
                        <p className="text-sm font-semibold">
                          Full Stack Web Development
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Database className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Database</p>
                        <p className="text-sm font-semibold">
                          SQL · MongoDB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Bug className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Testing</p>
                        <p className="text-sm font-semibold">
                          QA & Software Testing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Creative Skills</p>
                        <p className="text-sm font-semibold">
                          AI Creations & Digital Content
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Film className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Editing</p>
                        <p className="text-sm font-semibold">
                          Video & Photo Editing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs text-slate-400">Experience</p>
                        <p className="text-sm font-semibold">
                          Fresher
                        </p>
                      </div>
                    </div>

                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                      Technical Skills
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="mt-6 text-center text-xs font-bold tracking-[0.3em] text-red-400">
                    LEARN · BUILD · GROW
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
