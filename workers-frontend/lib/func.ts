export const formatQuestionType = (questionType: string) => {
  switch (questionType) {
    case "MULTIPLE_CHOICE":
      return "Multiple choice";
    case "CHECKBOXES":
      return "Checkbox";
    case "TEXT":
      return "User Input";
    case "DATE":
      return "Date";
    default:
      return "Unknown type"; // It's good practice to have a default case
  }
};
