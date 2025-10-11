# Use the official Deno image
FROM denoland/deno:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the main application file from the build context
COPY main.ts .

# Expose the port the app runs on
EXPOSE 9090

# Define the command to run the application
# Using CMD in this format allows for graceful shutdown
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
