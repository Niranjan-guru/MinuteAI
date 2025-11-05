/**
 * @fileOverview A conceptual example of K-Means clustering for meeting transcripts.
 */

// --- Sample Data ---
const sampleTranscript = `
  Sarah: The new ad designs for the campaign are ready for review.
  Tom: I am concerned about the color palette on the Facebook ads.
  Maya: The blog post about our top 10 features is halfway done.
  Sarah: We need to finalize the launch date for the marketing campaign.
  Tom: The visuals for Instagram look solid, the colors work well there.
  Maya: I will finish the draft of the blog post by this Friday.
`;

// --- 1. Preprocessing ---

// Simple sentence splitting.
const sentences = sampleTranscript
  .split('\n')
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => s.toLowerCase().replace(/[^\w\s]/g, '')); // Clean punctuation and lowercase

// --- 2. Vectorization (Simplified Bag-of-Words) ---
// NOTE: This is the step that would be replaced by an LLM embedding model for superior results.

// Create a vocabulary of all unique words in the transcript.
const vocabulary = [
  ...new Set(sentences.join(' ').split(' ')),
].filter(Boolean);

// Convert each sentence into a numerical vector based on word presence.
const vectors = sentences.map(sentence => {
  const sentenceWords = new Set(sentence.split(' '));
  return vocabulary.map(word => (sentenceWords.has(word) ? 1 : 0));
});

// --- 3. K-Means Clustering Implementation ---

/**
 * Calculates the Euclidean distance between two vectors.
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.map((val, i) => (val - b[i]) ** 2).reduce((sum, curr) => sum + curr, 0)
  );
}

/**
 * A basic implementation of the K-Means algorithm.
 * @param data The array of data points (vectors).
 * @param k The number of clusters to create.
 * @returns An array of cluster assignments for each data point.
 */
function kMeans(data: number[][], k: number): number[] {
  if (data.length < k) {
    return data.map((_, i) => i);
  }

  // 1. Initialize centroids randomly
  let centroids = data.slice(0, k);
  let assignments: number[] = [];
  let changed = true;

  while (changed) {
    changed = false;

    // 2. Assign each point to the nearest centroid
    const newAssignments = data.map(point => {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;
      centroids.forEach((centroid, index) => {
        const distance = euclideanDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = index;
        }
      });
      return closestCentroidIndex;
    });

    // Check if assignments have changed
    if (
      assignments.length !== newAssignments.length ||
      newAssignments.some((a, i) => a !== assignments[i])
    ) {
      assignments = newAssignments;
      changed = true;
    }

    // 3. Update centroids to be the mean of the points in their cluster
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);
      if (clusterPoints.length > 0) {
        centroids[i] = vocabulary.map((_, wordIndex) => {
          return (
            clusterPoints.reduce((sum, p) => sum + p[wordIndex], 0) /
            clusterPoints.length
          );
        });
      }
    }
  }

  return assignments;
}

// --- 4. Running the clustering and interpreting results ---

// Define how many topics we think are in the transcript.
const numberOfClusters = 2;
const clusterAssignments = kMeans(vectors, numberOfClusters);

// Display the results.
console.log('--- K-Means Clustering Example ---');
console.log('Original Sentences:', sentences);
console.log('\nCluster Assignments:', clusterAssignments);

for (let i = 0; i < numberOfClusters; i++) {
  console.log(`\n--- Cluster ${i + 1} (Topic ${String.fromCharCode(65 + i)}) ---`);
  sentences.forEach((sentence, index) => {
    if (clusterAssignments[index] === i) {
      console.log(`  - "${sentence}"`);
    }
  });
}
