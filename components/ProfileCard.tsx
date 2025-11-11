
import React from 'react';
import { Profile } from '../types';

interface ProfileCardProps {
  title: string;
  profile: Profile | null;
  onProfileChange?: (field: keyof Omit<Profile, 'avatarUrl'>, value: string) => void;
  isEditable?: boolean;
  isLoading?: boolean;
}

const SkeletonLoader: React.FC = () => (
  <div className="animate-pulse">
    <div className="w-32 h-32 mx-auto rounded-full bg-gray-600 mb-4"></div>
    <div className="h-6 bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
    <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto mb-4"></div>
    <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-600 rounded w-5/6"></div>
  </div>
);

export const ProfileCard: React.FC<ProfileCardProps> = ({
  title,
  profile,
  onProfileChange,
  isEditable = false,
  isLoading = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onProfileChange) {
      onProfileChange(e.target.name as keyof Omit<Profile, 'avatarUrl'>, e.target.value);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl shadow-cyan-500/10">
      <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-teal-400 text-transparent bg-clip-text">
        {title}
      </h2>
      {isLoading ? (
        <SkeletonLoader />
      ) : profile ? (
        <div className="text-center">
          <img
            src={profile.avatarUrl}
            alt="Profile Avatar"
            className="w-32 h-32 mx-auto rounded-full mb-4 border-4 border-gray-700 object-cover"
          />
          {isEditable ? (
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              className="text-2xl font-semibold text-white bg-transparent border-b-2 border-gray-600 focus:border-cyan-400 focus:outline-none text-center w-full"
            />
          ) : (
            <h3 className="text-2xl font-semibold text-white">{profile.name}</h3>
          )}
          {isEditable ? (
             <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
              className="text-gray-400 mt-1 bg-transparent border-b-2 border-gray-600 focus:border-cyan-400 focus:outline-none text-center w-full"
            />
          ) : (
             <p className="text-gray-400 mt-1">{profile.email}</p>
          )}
          <div className="mt-6 text-left">
            <label className="text-sm font-semibold text-gray-400">BIO</label>
             {isEditable ? (
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 text-gray-300 w-full bg-gray-900/50 rounded-lg p-2 border border-gray-700 focus:border-cyan-400 focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-gray-300 bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">{profile.bio}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full min-h-[300px]">
          <div className="w-32 h-32 rounded-full bg-gray-700/50 border-2 border-dashed border-gray-600 flex items-center justify-center mb-4">
            <span className="text-4xl">?</span>
          </div>
          <p>Awaiting AI generation...</p>
        </div>
      )}
    </div>
  );
};