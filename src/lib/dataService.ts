import { db } from './db';
import { supabase } from './supabase';

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-url')
);

export const dataService = {
  async getUserAttemptToday(userName: string, quizDate: string) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_attempts')
          .select('*')
          .eq('userName', userName)
          .eq('quizDate', quizDate)
          .maybeSingle();

        if (!error) return data; // Returns record if found, or null if not found
        console.error('Supabase fetch attempt error:', error);
      } catch (err) {
        console.warn('Supabase fetch attempt failed:', err);
      }
    }
    
    try {
      return await db.userAttempt.findFirst({
        where: { userName, quizDate },
      });
    } catch (dbErr) {
      console.error('Prisma fallback failed:', dbErr);
      return null;
    }
  },

  async getRandomActiveQuestion() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id, questionText, optionA, optionB, optionC, optionD, category, difficulty')
          .eq('active', true);

        if (!error && data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          return data[randomIndex];
        }
        if (error) console.error('Supabase question fetch error:', error);
      } catch (err) {
        console.warn('Supabase question fetch failed:', err);
      }
    }

    try {
      const questions: any[] = await db.$queryRaw`
        SELECT id, questionText, optionA, optionB, optionC, optionD, category, difficulty
        FROM questions
        WHERE active = 1
        ORDER BY RANDOM()
        LIMIT 1;
      `;
      return questions && questions.length > 0 ? questions[0] : null;
    } catch (dbErr) {
      console.error('Prisma question fallback failed:', dbErr);
      return null;
    }
  },

  async getQuestionById(id: number) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('id, correctOption, optionA, optionB, optionC, optionD')
          .eq('id', id)
          .single();

        if (!error) return data;
        console.error('Supabase getQuestionById error:', error);
      } catch (err) {
        console.warn('Supabase getQuestionById failed:', err);
      }
    }

    try {
      return await db.question.findUnique({
        where: { id },
        select: { id: true, correctOption: true, optionA: true, optionB: true, optionC: true, optionD: true },
      });
    } catch (dbErr) {
      console.error('Prisma getQuestionById fallback failed:', dbErr);
      return null;
    }
  },


  async createUserAttempt(data: {
    userName: string;
    quizDate: string;
    isCorrect: boolean;
    score: number;
    bonusPoints: number;
    totalPoints: number;
    responseTimeMs: number;
  }) {
    if (isSupabaseConfigured) {
      const { data: record, error } = await supabase
        .from('user_attempts')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Supabase create attempt error:', error);
        throw new Error(error.message);
      }
      return record;
    }

    try {
      return await db.userAttempt.create({ data });
    } catch (dbErr) {
      console.error('Prisma createUserAttempt fallback failed:', dbErr);
      throw dbErr;
    }
  },

  async getAllAttempts() {
    if (isSupabaseConfigured) {
      try {
        // Supabase caps single requests at 1000 rows — paginate to get all records.
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let from = 0;

        while (true) {
          const { data, error } = await supabase
            .from('user_attempts')
            .select('*')
            .range(from, from + PAGE_SIZE - 1);

          if (error) {
            console.error('Supabase getAllAttempts error:', error);
            break;
          }
          if (!data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < PAGE_SIZE) break; // last page
          from += PAGE_SIZE;
        }

        if (allData.length > 0) return allData;
      } catch (err) {
        console.warn('Supabase getAllAttempts failed:', err);
      }
    }

    try {
      return await db.userAttempt.findMany();
    } catch (dbErr) {
      console.error('Prisma getAllAttempts fallback failed:', dbErr);
      return [];
    }
  },

  async getAttemptsByDateRange(minDate: string) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_attempts')
          .select('*')
          .gte('quizDate', minDate);
        if (!error && data) return data;
        console.error('Supabase getAttemptsByDateRange error:', error);
      } catch (err) {
        console.warn('Supabase getAttemptsByDateRange failed:', err);
      }
    }

    try {
      return await db.userAttempt.findMany({
        where: { quizDate: { gte: minDate } },
      });
    } catch (dbErr) {
      console.error('Prisma getAttemptsByDateRange fallback failed:', dbErr);
      return [];
    }
  },

  async getUserAttempts(userName: string) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_attempts')
          .select('*')
          .eq('userName', userName)
          .order('createdAt', { ascending: false });

        if (!error && data) return data;
        console.error('Supabase getUserAttempts error:', error);
      } catch (err) {
        console.warn('Supabase getUserAttempts failed:', err);
      }
    }

    try {
      return await db.userAttempt.findMany({
        where: { userName },
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbErr) {
      console.error('Prisma getUserAttempts fallback failed:', dbErr);
      return [];
    }
  },

  async getAllQuestions() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data) return data;
        console.error('Supabase getAllQuestions error:', error);
      } catch (err) {
        console.warn('Supabase getAllQuestions failed:', err);
      }
    }

    try {
      return await db.question.findMany({ orderBy: { id: 'asc' } });
    } catch (dbErr) {
      console.error('Prisma getAllQuestions fallback failed:', dbErr);
      return [];
    }
  },

  async createQuestion(questionData: any) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single();

      if (error) {
        console.error('Supabase createQuestion error:', error);
        throw new Error(error.message);
      }
      return data;
    }

    try {
      return await db.question.create({ data: questionData });
    } catch (dbErr) {
      console.error('Prisma createQuestion fallback failed:', dbErr);
      throw dbErr;
    }
  },

  async updateQuestion(id: number, questionData: any) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('questions')
        .update({
          ...questionData,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateQuestion error:', error);
        throw new Error(error.message);
      }
      return data;
    }

    try {
      return await db.question.update({ where: { id }, data: questionData });
    } catch (dbErr) {
      console.error('Prisma updateQuestion fallback failed:', dbErr);
      throw dbErr;
    }
  },

  async deleteQuestion(id: number) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteQuestion error:', error);
        throw new Error(error.message);
      }
      return true;
    }

    try {
      await db.question.delete({ where: { id } });
      return true;
    } catch (dbErr) {
      console.error('Prisma deleteQuestion fallback failed:', dbErr);
      return false;
    }
  },

  async resetLeaderboard() {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('user_attempts').delete().neq('id', 0);
      if (error) {
        console.error('Supabase resetLeaderboard error:', error);
        throw new Error(error.message);
      }
      return true;
    }

    try {
      await db.userAttempt.deleteMany();
      return true;
    } catch (dbErr) {
      console.error('Prisma resetLeaderboard fallback failed:', dbErr);
      return false;
    }
  }
};
