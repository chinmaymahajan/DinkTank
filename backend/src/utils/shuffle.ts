/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 * 
 * This implementation provides unbiased randomization by iterating through
 * the array and swapping each element with a randomly selected element
 * from the remaining unshuffled portion.
 * 
 * Time complexity: O(n)
 * Space complexity: O(1) - modifies array in place
 * 
 * @param array - The array to shuffle (will be modified in place)
 * @returns The shuffled array (same reference as input)
 */
export function shuffle<T>(array: T[]): T[] {
  // Start from the last element and swap with a random element before it
  for (let i = array.length - 1; i > 0; i--) {
    // Generate random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements at positions i and j
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array;
}
