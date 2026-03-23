#!/usr/bin/env ts-node
/**
 * Demo Recording Generator
 *
 * Generates a complete demo course using mock mode (no API keys required).
 * Writes the result to demo/demo-course.json for use in /tutorial/demo.
 *
 * Usage:
 *   cd backend
 *   AI_PROVIDER=mock npx ts-node scripts/generate-demo.ts
 *
 * Output: demo/demo-course.json
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

config(); // load .env

// Force mock mode for demo generation
process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'mock';

// Dynamic imports after env is set
async function main() {
  const { generateCurriculum } = await import('../src/services/ai/curriculumEngine');
  const { generateLesson } = await import('../src/services/ai/lessonGenerator');
  const { synthesizeNarration, buildAudioEvents } = await import('../src/services/ai/voiceSynthesis');

  const provider = process.env.AI_PROVIDER || 'mock';
  const isMock = provider === 'mock';

  console.log(`\n🎬 CodeTube Demo Generator`);
  console.log(`   AI Provider: ${provider}${isMock ? ' (no API key required)' : ''}`);
  console.log(`   Fish Audio:  ${process.env.FISH_AUDIO_API_KEY ? 'configured' : 'mock mode'}`);
  console.log('');

  // 1. Generate curriculum
  console.log('📚 Generating curriculum: "TypeScript for Beginners" ...');
  const curriculum = await generateCurriculum(
    'TypeScript',
    'beginner',
    'chill',
    3 // Only 3 lessons for a quick demo
  );
  console.log(`   ✓ Course: "${curriculum.title}"`);
  console.log(`   ✓ ${curriculum.totalLessons} lessons planned`);

  // 2. Generate lesson content
  console.log('\n📝 Generating lesson content...');
  const generatedLessons = [];
  for (const outline of curriculum.lessons) {
    console.log(`   → Lesson ${outline.index + 1}: ${outline.title}`);
    const lesson = await generateLesson(outline, curriculum.topic, 'chill');
    console.log(`     ✓ ${lesson.codeExamples.length} code examples`);
    console.log(`     ✓ ${lesson.narrationSegments.length} narration segments`);
    console.log(`     ✓ ${lesson.recordingEvents.length} recording events`);

    // 3. Synthesize narration
    console.log(`     → Synthesizing voice narration (${process.env.FISH_AUDIO_API_KEY ? 'Fish Audio' : 'mock'})...`);
    const synthesized = await synthesizeNarration(
      lesson.narrationSegments,
      'chill',
      `demo/lesson-${outline.index}`
    );
    const audioEvents = buildAudioEvents(synthesized);
    const nonAudio = lesson.recordingEvents.filter((e) => e.type !== 'AUDIO');
    lesson.recordingEvents = [...audioEvents, ...nonAudio].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    console.log(`     ✓ ${audioEvents.length} audio events built`);

    generatedLessons.push(lesson);
  }

  // 4. Assemble demo output
  const demoOutput = {
    generatedAt: new Date().toISOString(),
    provider,
    fishAudioEnabled: Boolean(process.env.FISH_AUDIO_API_KEY),
    course: {
      id: 'demo-course',
      title: curriculum.title,
      description: curriculum.description,
      topic: curriculum.topic,
      level: curriculum.level,
      totalLessons: curriculum.totalLessons,
      estimatedTotalDurationSec: curriculum.estimatedTotalDurationSec,
      prerequisites: curriculum.prerequisites,
      outcomes: curriculum.outcomes,
    },
    lessons: generatedLessons.map((l) => ({
      lessonIndex: l.lessonIndex,
      title: l.title,
      objective: l.objective,
      durationSec: l.durationSec,
      codeExamplesCount: l.codeExamples.length,
      exercisesCount: l.exercises.length,
      checkpointsCount: l.checkpoints.length,
      audioSegmentsCount: l.recordingEvents.filter((e) => e.type === 'AUDIO').length,
      typeEventsCount: l.recordingEvents.filter((e) => e.type === 'TYPE').length,
      totalEventsCount: l.recordingEvents.length,
      // Include first lesson's full events for demo playback
      ...(l.lessonIndex === 0 && {
        recordingEvents: l.recordingEvents,
        codeExamples: l.codeExamples,
        narrationSegments: l.narrationSegments,
      }),
    })),
    pipeline: {
      curriculumGenerated: true,
      lessonsGenerated: generatedLessons.length,
      audioSynthesized: true,
      eventsAssembled: true,
    },
  };

  // 5. Write output
  const outputDir = path.join(__dirname, '..', 'demo');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'demo-course.json');
  await fs.writeFile(outputPath, JSON.stringify(demoOutput, null, 2));

  console.log('\n✅ Demo generation complete!');
  console.log(`   Output: ${outputPath}`);
  console.log(`   Course: "${curriculum.title}"`);
  console.log(`   Lessons: ${generatedLessons.length}`);
  console.log(`   Total events: ${generatedLessons.reduce((s, l) => s + l.recordingEvents.length, 0)}`);
  console.log(`\n   To test playback, visit /tutorial/demo (Next.js app)`);
  console.log(`   or /demo (Vite app)\n`);

  return demoOutput;
}

main().catch((err) => {
  console.error('\n❌ Demo generation failed:', err.message);
  if (err.message.includes('API_KEY')) {
    console.error('   Tip: Set AI_PROVIDER=mock in .env to run without an API key.');
  }
  process.exit(1);
});
