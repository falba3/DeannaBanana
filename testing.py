from gemini_utils import generate_tryon

# Ask the user for paths and prompt
face_path = input("Enter the path to the face image: ")
clothing_path = input("Enter the path to the clothing image: ")
prompt_text = input("Enter your prompt (or leave blank for default): ")
output_path = input("Enter output file path (or leave blank for default): ")

# Call your function
generate_tryon(face_path, clothing_path, prompt_text, output_path)

# Face Path --          people/person3.jpg
# Clothing Path --      clothes/clothes2.jpeg
# Prompt Text --        Combine the first image's face with the second image's clothing piece. The person must be wearing the clothing piece. Remove all other accessories that might interfere with seeing the clothing piece which is the highlight. 
# Output Path --        outputs/sample3.png