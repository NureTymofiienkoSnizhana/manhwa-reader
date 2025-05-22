// Experience points for different activities
const EXP_REWARDS = {
    READ_MANHWA: 50,
    WRITE_REVIEW: 20,
    RATE_MANHWA: 5,
    CREATE_CATEGORY: 10,
    ADD_TO_CATEGORY: 2,
    COMPLETE_TASK: 100
  };
  
  // Calculate level based on experience
  const calculateLevel = (exp) => {
    // Simple formula: level = sqrt(exp / 100)
    return Math.floor(Math.sqrt(exp / 100)) + 1;
  };
  
  // Calculate exp needed for next level
  const expForNextLevel = (level) => {
    return level * level * 100;
  };
  
  // Calculate progress percentage to next level
  const levelProgress = (exp, level) => {
    const currentLevelExp = (level - 1) * (level - 1) * 100;
    const nextLevelExp = level * level * 100;
    const requiredExp = nextLevelExp - currentLevelExp;
    const userProgress = exp - currentLevelExp;
    
    return Math.min(100, Math.floor((userProgress / requiredExp) * 100));
  };
  
  module.exports = {
    EXP_REWARDS,
    calculateLevel,
    expForNextLevel,
    levelProgress
  };