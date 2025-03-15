"use client";

import { useAuth } from "./auth";
import { useCallback, useEffect, useState } from 'react';

// Define course interface based on your backend response
export interface Course {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
  moduleCount?: number;
  role?: string;
  org?: {
    id: number;
    name: string;
    slug: string;
  };
  org_id?: number;
  // Add other fields as needed
}

// School interface (mapped from organization in the API)
export interface School {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  role?: string;
  slug?: string;
  // Add other fields as needed
}

/**
 * Hook to fetch courses for the current user
 */
export function useCourses() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch courses immediately when user ID is available
  useEffect(() => {
    if (!isAuthenticated || !user?.id || authLoading) {
      return;
    }
    
    setIsLoading(true);
    
    // Simple fetch without caching
    fetch(`http://localhost:8001/users/${user.id}/courses`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Transform the API response to match the expected format
        const formattedCourses: Course[] = data.map((course: any) => ({
          id: course.id,
          title: course.name,
          description: course.description,
          moduleCount: course.moduleCount || 0,
          role: course.role,
          org: course.org,
          org_id: course.org?.id,
          coverImage: course.coverImage,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }));
        
        setCourses(formattedCourses);
      })
      .catch(err => {
        console.error('Error fetching courses:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.id, isAuthenticated, authLoading]);
  
  return {
    courses,
    isLoading,
    error
  };
}

/**
 * Hook to fetch schools for the current user
 */
export function useSchools() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch schools immediately when user ID is available
  useEffect(() => {
    if (!isAuthenticated || !user?.id || authLoading) {
      return;
    }
    
    setIsLoading(true);
    
    // Simple fetch without caching
    fetch(`http://localhost:8001/users/${user.id}/orgs`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Transform the API response to match the expected format
        const formattedSchools: School[] = data.map((org: any) => ({
          id: org.id,
          name: org.name,
          description: org.description,
          url: org.url,
          role: org.role,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt
        }));
        
        setSchools(formattedSchools);
      })
      .catch(err => {
        console.error('Error fetching schools:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.id, isAuthenticated, authLoading]);
  
  return {
    schools,
    isLoading,
    error
  };
} 