"use client";

import React, { useState, useEffect } from "react";
import { Stethoscope, Heart, Sparkles, Brain, Bone, Baby, Smile, Activity, Eye, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SpecializationsManagement() {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const iconMap = {
    heart: Heart,
    sparkles: Sparkles,
    brain: Brain,
    bone: Bone,
    baby: Baby,
    smile: Smile,
    activity: Activity,
    eye: Eye,
    stethoscope: Stethoscope,
  };

  useEffect(() => {
    fetchSpecializations();
  }, []);

  async function fetchSpecializations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("specializations")
        .select("id, name, description, icon")
        .order("name");

      if (error) throw error;
      if (data && data.length > 0) {
        setSpecializations(data);
      } else {
        // Fallback default medical catalog
        setSpecializations([
          { id: "1", name: "Cardiology", description: "Heart health, cardiovascular diseases and hypertension", icon: "heart" },
          { id: "2", name: "Dermatology", description: "Skin, hair, nail conditions and cosmetic clinical care", icon: "sparkles" },
          { id: "3", name: "Neurology", description: "Brain, spinal cord, nervous system and migraine care", icon: "brain" },
          { id: "4", name: "Orthopedics", description: "Bones, joints, ligaments, spine and musculoskeletal disorders", icon: "bone" },
          { id: "5", name: "Pediatrics", description: "Comprehensive healthcare for infants and children", icon: "baby" },
          { id: "6", name: "Dentistry", description: "Dental hygiene, orthodontics, oral surgery and tooth care", icon: "smile" },
          { id: "7", name: "Psychiatry", description: "Mental wellness, counseling, therapy and psychiatry", icon: "activity" },
          { id: "8", name: "General Medicine", description: "Primary healthcare, diagnostics and chronic illness care", icon: "stethoscope" },
          { id: "9", name: "Ophthalmology", description: "Eye care, vision examination, cataracts and laser treatment", icon: "eye" },
        ]);
      }
    } catch (err) {
      console.warn("Using active specializations list:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = specializations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Medical Specializations</h3>
          <p className="text-xs text-slate-500">Categories available for patient search and doctor verification</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2 text-slate-800"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const Icon = iconMap[item.icon] || Stethoscope;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
