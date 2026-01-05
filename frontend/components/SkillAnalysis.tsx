"use client";

import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react";

export default function SkillAnalysis() {
  const { skillAreas, learningPatterns } = useDashboardAnalytics();

  const strengths = skillAreas.filter((s) => s.category === "strength");
  const developing = skillAreas.filter((s) => s.category === "developing");
  const needsAttention = skillAreas.filter(
    (s) => s.category === "needs-attention"
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "strength":
        return <CheckCircle2 className="w-5 h-5" />;
      case "developing":
        return <TrendingUp className="w-5 h-5" />;
      case "needs-attention":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4 w-full pb-5">
      {/* Header */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-1">Skill Analysis</h3>
        <p className="text-xs text-gray-600">
          Understand your strengths and areas for growth
        </p>
      </div>

      {/* Learning Insights Card */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
        <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
          <span>💡</span> Learning Insights
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-semibold">•</span>
            <p className="text-gray-700">
              You perform best at{" "}
              <span className="font-semibold text-purple-700">
                {learningPatterns.preferredDifficulty}
              </span>{" "}
              difficulty
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-600 font-semibold">•</span>
            <p className="text-gray-700">
              Study frequency:{" "}
              <span className="font-semibold text-purple-700 capitalize">
                {learningPatterns.studyFrequency}
              </span>
            </p>
          </div>
          {learningPatterns.strongAreas.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">•</span>
              <p className="text-gray-700">
                Strong in:{" "}
                <span className="font-semibold text-purple-700">
                  {learningPatterns.strongAreas.join(", ")}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skill Categories */}
      <div className="space-y-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Your Strengths ({strengths.length})
            </h4>
            <div className="space-y-2">
              {strengths.map((skill) => (
                <SkillCard key={skill.skill} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Developing Skills */}
        {developing.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-yellow-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Developing Skills ({developing.length})
            </h4>
            <div className="space-y-2">
              {developing.map((skill) => (
                <SkillCard key={skill.skill} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Needs Practice ({needsAttention.length})
            </h4>
            <div className="space-y-2">
              {needsAttention.map((skill) => (
                <SkillCard key={skill.skill} skill={skill} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Common Mistakes */}
      {learningPatterns.commonMistakes.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-red-800 mb-2">
            ⚠️ Common Challenges
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {learningPatterns.commonMistakes.map((mistake, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{mistake}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-2 italic">
            Focus on these areas to improve your overall performance
          </p>
        </div>
      )}
    </div>
  );
}

function SkillCard({ skill }: { skill: any }) {
  const color =
    skill.category === "strength"
      ? "green"
      : skill.category === "developing"
      ? "yellow"
      : "red";

  return (
    <div
      className={`bg-white border-2 border-${color}-200 rounded-lg p-3 hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{skill.icon}</span>
          <div>
            <p className="font-semibold text-sm text-gray-800">{skill.skill}</p>
            <p className="text-xs text-gray-600">
              {skill.exerciseCount} exercises completed
            </p>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-full bg-${color}-100 border border-${color}-300`}
        >
          <p className={`text-xs font-bold text-${color}-700`}>
            {skill.strength}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full bg-${color}-500 transition-all duration-500`}
          style={{ width: `${skill.strength}%` }}
        />
      </div>

      {/* Insights */}
      <div className="space-y-1">
        {skill.insights.map((insight: string, idx: number) => (
          <p key={idx} className="text-xs text-gray-600 flex items-start gap-1">
            <span className={`text-${color}-500`}>•</span>
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
