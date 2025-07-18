import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useDSA } from '../context/DSAContext';
import ProblemModal from './problems/ProblemModal';
import { Problem } from '../context/DSAContext';
import Button from './common/Button';
import Card from './common/Card';

const { 
  FiExternalLink, FiCheck, FiClock, FiPlay, FiZap, FiCode, 
  FiBookmark, FiStar, FiTrendingDown, FiRefreshCw, FiHeart,
  FiTarget, FiAward, FiEdit3, FiChevronDown, FiTrash2
} = FiIcons;

interface ProblemCardProps {
  problem: Problem;
  showRevisionInfo?: boolean;
  onEdit?: (problem: Problem) => void;
  onStatusChange?: (problemId: string, newStatus: string) => void;
  onNeedActivationDelete?: (problem: Problem) => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, showRevisionInfo = false, onEdit, onStatusChange, onNeedActivationDelete }) => {
  const { updateProblemStatus, toggleBookmark, markForRevision, updateConfidenceLevel } = useDSA();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<string>(problem.status || 'Not Started');
  const [showNeedsRevision, setShowNeedsRevision] = useState<boolean>(problem.status === 'Needs Revision');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900 border-success-200 dark:border-success-800';
      case 'Medium': return 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900 border-warning-200 dark:border-warning-800';
      case 'Hard': return 'text-danger-600 dark:text-danger-400 bg-danger-100 dark:bg-danger-900 border-danger-200 dark:border-danger-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900';
      case 'In Progress': return 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900';
      case 'Needs Revision': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done': return FiCheck;
      case 'In Progress': return FiPlay;
      case 'Needs Revision': return FiRefreshCw;
      default: return FiClock;
    }
  };

  const getConfidenceColor = (level: number | undefined) => {
    if ((level ?? 0) <= 2) return 'text-red-600 dark:text-red-400';
    if ((level ?? 0) <= 3) return 'text-orange-600 dark:text-orange-400';
    if ((level ?? 0) <= 4) return 'text-blue-600 dark:text-blue-400';
    return 'text-green-600 dark:text-green-400';
  };

  const handleStatusChange = async (newStatus: string) => {
    const prevStatus = localStatus;
    setLocalStatus(newStatus);
    try {
      await updateProblemStatus(problem.id, newStatus);
      if (onStatusChange && (prevStatus === 'Needs Revision' || prevStatus === 'Done') && newStatus !== prevStatus) {
        onStatusChange(problem.id, newStatus);
      }
      if (newStatus !== 'Needs Revision') setShowNeedsRevision(false);
      else setShowNeedsRevision(true);
    } catch (err) {
      // If update fails, revert local state
      setLocalStatus(prevStatus);
      if (newStatus === 'Needs Revision') setShowNeedsRevision(false);
      if (onStatusChange && (prevStatus === 'Needs Revision' || prevStatus === 'Done') && newStatus !== prevStatus) {
        onStatusChange(problem.id, newStatus);
      }
    }
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleBookmark(problem.id, !problem.is_bookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleRevisionMark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markForRevision(problem.id, 'Marked for revision from problem card');
      setShowNeedsRevision(true);
      setLocalStatus('Needs Revision');
    } catch (err) {
      setShowNeedsRevision(false);
    }
  };

  const handleConfidenceChange = async (e: React.MouseEvent, level: number | undefined) => {
    e.stopPropagation();
    try {
      await updateConfidenceLevel(problem.id, level ?? 1);
    } catch (err) {
      console.error('Failed to update confidence:', err);
    }
  };

  return (
    <>
      <Card
        className="flex flex-col gap-4 min-h-[280px] max-w-full"
        hoverable
        padding="p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-words whitespace-normal">
              {problem.title}
            </h3>
            {problem.is_bookmarked && (
              <SafeIcon icon={FiBookmark} className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />
            )}
            {problem.is_interview_ready && (
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-xs font-semibold text-purple-700 dark:text-purple-300 ml-2 flex-shrink-0">
                <SafeIcon icon={FiAward} className="w-3 h-3 mr-1" /> Ready
              </span>
            )}
          </div>
          <div className="flex flex-row items-center gap-1 flex-shrink-0 self-stretch justify-end">
            <Button
              onClick={(e) => { e.stopPropagation(); setModalType('details'); setIsModalOpen(true); }}
              variant="icon"
              size="sm"
              title="View Details"
              leftIcon={<SafeIcon icon={FiCode} className="w-4 h-4" />}
            />
            {onEdit && (
              <Button
                onClick={(e) => { e.stopPropagation(); onEdit(problem); }}
                variant="icon"
                size="sm"
                title="Edit Problem"
                leftIcon={<SafeIcon icon={FiEdit3} className="w-4 h-4" />}
              />
            )}
            <Button
              onClick={handleBookmarkToggle}
              variant="icon"
              size="sm"
              title={problem.is_bookmarked ? 'Remove Bookmark' : 'Bookmark'}
              className={`${problem.is_bookmarked ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'} hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors`}
              leftIcon={<SafeIcon icon={FiBookmark} className="w-4 h-4" />}
            />
            {problem.external_url && (
              <a
                href={problem.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors shadow-sm flex items-center justify-center"
                title="External Link"
                onClick={(e) => e.stopPropagation()}
                style={{ height: 32, width: 32 }}
              >
                <SafeIcon icon={FiExternalLink} className="w-4 h-4" />
              </a>
            )}
            {onNeedActivationDelete && (
              <button
                onClick={() => onNeedActivationDelete(problem)}
                className="p-1 rounded-full bg-red-500 text-white border border-red-600 hover:bg-red-600 hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors shadow flex items-center justify-center"
                title="Remove from Need Activation"
                aria-label="Remove from Need Activation"
                style={{ height: 32, width: 32 }}
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status & Metadata */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
            {problem.topic}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <SafeIcon icon={FiZap} className="w-3 h-3" />
            <span>+{problem.xp_reward || 10} XP</span>
          </span>
          <div className="relative">
            <select
              value={localStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`appearance-none pr-6 px-3 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(localStatus)} cursor-pointer`}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Needs Revision">Needs Revision</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiChevronDown size={12} />
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {problem.company_tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-md font-medium">
              {tag}
            </span>
          ))}
          {problem.pattern_tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-medium">
              {tag}
            </span>
          ))}
          {((problem.company_tags?.length || 0) + (problem.pattern_tags?.length || 0)) > 4 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-medium">
              +{((problem.company_tags?.length || 0) + (problem.pattern_tags?.length || 0)) - 4} more
            </span>
          )}
        </div>

        {/* Description */}
        {problem.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3 whitespace-pre-line break-words">
            {problem.description}
          </p>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {(problem.confidence_level ?? 0) >= 4 && localStatus === 'Done' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 dark:bg-green-900 text-xs font-semibold text-green-700 dark:text-green-400">
              <SafeIcon icon={FiTarget} className="w-3 h-3 mr-1" /> High Confidence
            </span>
          )}
          {showNeedsRevision && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900 text-xs font-semibold text-orange-700 dark:text-orange-400">
              <SafeIcon icon={FiRefreshCw} className="w-3 h-3 mr-1" /> Needs Revision
            </span>
          )}
          {problem.completed_at && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400">
              <SafeIcon icon={FiCheck} className="w-3 h-3 mr-1" /> 
              Completed: {new Date(problem.completed_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Notes Preview */}
        {(problem.personal_notes || problem.approach_notes || problem.key_insights) && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {problem.key_insights || problem.personal_notes || problem.approach_notes}
            </div>
          </div>
        )}

        {/* Confidence Level */}
        {typeof problem.confidence_level === 'number' && (
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-xs text-gray-600 dark:text-gray-400">Confidence:</span>
            <div className={`flex items-center gap-1 ${getConfidenceColor(problem.confidence_level ?? 0)}`}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  onClick={(e) => handleConfidenceChange(e, level)}
                  variant="icon"
                  size="sm"
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    level <= (problem.confidence_level ?? 0)
                      ? `${getConfidenceColor(problem.confidence_level ?? 0)} border-current`
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  leftIcon={<SafeIcon 
                    icon={level <= (problem.confidence_level ?? 0) ? FiHeart : FiHeart} 
                    className="w-full h-full" 
                  />}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mark for Revision Button */}
        {localStatus === 'Done' && (
          <Button
            onClick={handleRevisionMark}
            variant="secondary"
            size="sm"
            className="mt-2 flex items-center space-x-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-md hover:bg-orange-200 dark:hover:bg-orange-800 font-semibold self-start"
            leftIcon={<SafeIcon icon={FiRefreshCw} className="w-3 h-3" />}
          >
            Mark for Revision
          </Button>
        )}
      </Card>

      {/* Modal: Details */}
      {isModalOpen && modalType === 'details' && (
        <ProblemModal
          problem={problem}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setModalType(null); }}
        />
      )}
    </>
  );
};

export default ProblemCard;