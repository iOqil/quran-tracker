import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\server\src\index.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_post_handler = """app.post('/api/repetition/plans', authenticateUser, async (req, res) => {
  const user = req.user;
  const { surahId, days, times, startDate } = req.body;

  if (!surahId || !days || !Array.isArray(days) || !times || !Array.isArray(times)) {
    return res.status(400).json({ error: 'Noto\\'g\\'ri ma\\'lumotlar yuborildi' });
  }

  const sId = parseId(surahId.toString());

  if (!sId) {
    return res.status(400).json({ error: 'Noto\\'g\\'ri sura ID' });
  }

  try {
    const surahExists = await prisma.surah.findUnique({
      where: { id: sId }
    });

    if (!surahExists) {
      return res.status(404).json({ error: 'Sura topilmadi' });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const baseDateString = sDate.toISOString().split('T')[0];

    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Find existing or create plan
      let plan = await tx.repetitionPlan.findUnique({
        where: {
          userId_surahId: { userId: user.id, surahId: sId }
        }
      });

      if (plan) {
        plan = await tx.repetitionPlan.update({
          where: { id: plan.id },
          data: {
            days: JSON.stringify(days),
            times: JSON.stringify(times),
            startDate: sDate
          }
        });
      } else {
        plan = await tx.repetitionPlan.create({
          data: {
            userId: user.id,
            surahId: sId,
            days: JSON.stringify(days),
            times: JSON.stringify(times),
            startDate: sDate
          }
        });
      }

      // Synchronize sessions using timezone-safe UTC arithmetic
      const generatedSessions: { dayNumber: number; date: string; time: string }[] = [];
      const baseDateTime = new Date(baseDateString + 'T00:00:00Z');
      
      for (const day of days) {
        const targetDateObj = new Date(baseDateTime.getTime());
        targetDateObj.setUTCDate(targetDateObj.getUTCDate() + (day - 1));
        const targetDateStr = targetDateObj.toISOString().split('T')[0];
        
        for (const time of times) {
          generatedSessions.push({
            dayNumber: day,
            date: targetDateStr,
            time: time
          });
        }
      }

      const existingSessions = await tx.repetitionSession.findMany({
        where: { planId: plan.id }
      });

      // Filter sessions to delete
      const sessionsToDelete = existingSessions.filter(session => {
        const isStillInSchedule = generatedSessions.some(gs => gs.date === session.date && gs.time === session.time);
        return !isStillInSchedule && session.status === 'Kutilmoqda';
      });

      if (sessionsToDelete.length > 0) {
        await tx.repetitionSession.deleteMany({
          where: {
            id: { in: sessionsToDelete.map(s => s.id) }
          }
        });
      }

      // Filter sessions to create
      const sessionsToCreate = generatedSessions.filter(gs => {
        return !existingSessions.some(es => es.date === gs.date && es.time === gs.time);
      });

      if (sessionsToCreate.length > 0) {
        await tx.repetitionSession.createMany({
          data: sessionsToCreate.map(gs => ({
            userId: user.id,
            planId: plan.id,
            dayNumber: gs.dayNumber,
            date: gs.date,
            time: gs.time,
            status: 'Kutilmoqda'
          }))
        });
      }

      // Return plan with sessions
      return await tx.repetitionPlan.findUnique({
        where: { id: plan.id },
        include: {
          surah: true,
          sessions: {
            orderBy: [
              { date: 'asc' },
              { time: 'asc' }
            ]
          }
        }
      });
    });

    res.json(updatedPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});"""

new_post_handler = """app.post('/api/repetition/plans', authenticateUser, async (req, res) => {
  const user = req.user;
  const { surahId, surahIds, days, times, startDate } = req.body;

  let idsToProcess: number[] = [];
  if (surahIds && Array.isArray(surahIds)) {
    idsToProcess = surahIds.map((id: any) => parseId(id?.toString() || '')).filter((id: number | null): id is number => id !== null);
  } else if (surahId) {
    const sId = parseId(surahId.toString());
    if (sId) idsToProcess.push(sId);
  }

  if (idsToProcess.length === 0 || !days || !Array.isArray(days) || !times || !Array.isArray(times)) {
    return res.status(400).json({ error: 'Noto\\'g\\'ri ma\\'lumotlar yuborildi' });
  }

  try {
    const validSurahsCount = await prisma.surah.count({
      where: { id: { in: idsToProcess } }
    });

    if (validSurahsCount !== idsToProcess.length) {
      return res.status(404).json({ error: 'Ba\\'zi suralar topilmadi' });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const baseDateString = sDate.toISOString().split('T')[0];

    const updatedPlans = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const sId of idsToProcess) {
        // Find existing or create plan
        let plan = await tx.repetitionPlan.findUnique({
          where: {
            userId_surahId: { userId: user.id, surahId: sId }
          }
        });

        if (plan) {
          plan = await tx.repetitionPlan.update({
            where: { id: plan.id },
            data: {
              days: JSON.stringify(days),
              times: JSON.stringify(times),
              startDate: sDate
            }
          });
        } else {
          plan = await tx.repetitionPlan.create({
            data: {
              userId: user.id,
              surahId: sId,
              days: JSON.stringify(days),
              times: JSON.stringify(times),
              startDate: sDate
            }
          });
        }

        // Synchronize sessions using timezone-safe UTC arithmetic
        const generatedSessions: { dayNumber: number; date: string; time: string }[] = [];
        const baseDateTime = new Date(baseDateString + 'T00:00:00Z');
        
        for (const day of days) {
          const targetDateObj = new Date(baseDateTime.getTime());
          targetDateObj.setUTCDate(targetDateObj.getUTCDate() + (day - 1));
          const targetDateStr = targetDateObj.toISOString().split('T')[0];
          
          for (const time of times) {
            generatedSessions.push({
              dayNumber: day,
              date: targetDateStr,
              time: time
            });
          }
        }

        const existingSessions = await tx.repetitionSession.findMany({
          where: { planId: plan.id }
        });

        // Filter sessions to delete
        const sessionsToDelete = existingSessions.filter(session => {
          const isStillInSchedule = generatedSessions.some(gs => gs.date === session.date && gs.time === session.time);
          return !isStillInSchedule && session.status === 'Kutilmoqda';
        });

        if (sessionsToDelete.length > 0) {
          await tx.repetitionSession.deleteMany({
            where: {
              id: { in: sessionsToDelete.map(s => s.id) }
            }
          });
        }

        // Filter sessions to create
        const sessionsToCreate = generatedSessions.filter(gs => {
          return !existingSessions.some(es => es.date === gs.date && es.time === gs.time);
        });

        if (sessionsToCreate.length > 0) {
          await tx.repetitionSession.createMany({
            data: sessionsToCreate.map(gs => ({
              userId: user.id,
              planId: plan.id,
              dayNumber: gs.dayNumber,
              date: gs.date,
              time: gs.time,
              status: 'Kutilmoqda'
            }))
          });
        }

        // Return plan with sessions
        const updatedPlan = await tx.repetitionPlan.findUnique({
          where: { id: plan.id },
          include: {
            surah: true,
            sessions: {
              orderBy: [
                { date: 'asc' },
                { time: 'asc' }
              ]
            }
          }
        });
        results.push(updatedPlan);
      }
      return results;
    }, {
      timeout: 15000 // Multi-surah tx might need a bit more time
    });

    res.json(updatedPlans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});"""

content = content.replace(old_post_handler, new_post_handler)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend API updated successfully.")
