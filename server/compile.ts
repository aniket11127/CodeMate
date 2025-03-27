import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

// Interface for compile/execution result
export interface CompileResult {
  success: boolean;
  output?: string;
  error?: string;
}

// Helper to create a temporary file
async function createTempFile(content: string, extension: string): Promise<string> {
  const tempDir = tmpdir();
  const randomId = randomBytes(8).toString('hex');
  const filename = `codecollab_${randomId}${extension}`;
  const filepath = join(tempDir, filename);
  await fs.writeFile(filepath, content);
  return filepath;
}

// Helper to execute a command with timeout
function executeCommand(command: string, timeout = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = exec(command, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Main function to execute code based on language
export async function executeCode(code: string, language: string): Promise<CompileResult> {
  try {
    // Sanitize language input to prevent command injection
    const sanitizedLanguage = language.toLowerCase().replace(/[^a-z]/g, '');
    
    switch (sanitizedLanguage) {
      case 'javascript': {
        // For JavaScript we use Node.js
        const filepath = await createTempFile(code, '.js');
        try {
          const output = await executeCommand(`node ${filepath}`);
          return { success: true, output };
        } catch (error) {
          return { success: false, error: error as string };
        } finally {
          await fs.unlink(filepath).catch(() => {});
        }
      }
      
      case 'python': {
        // For Python we use Python 3
        const filepath = await createTempFile(code, '.py');
        try {
          const output = await executeCommand(`python3 ${filepath}`);
          return { success: true, output };
        } catch (error) {
          return { success: false, error: error as string };
        } finally {
          await fs.unlink(filepath).catch(() => {});
        }
      }
      
      case 'java': {
        // For Java we need to extract the class name and create a file with that name
        const classNameMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
        if (!classNameMatch) {
          return { 
            success: false, 
            error: "Could not find a public class name. Java code must contain a public class." 
          };
        }
        
        const className = classNameMatch[1];
        const filepath = await createTempFile(code, '.java');
        const directory = filepath.substring(0, filepath.lastIndexOf('/'));
        
        try {
          // Compile first
          await executeCommand(`javac ${filepath}`);
          // Then run
          const output = await executeCommand(`cd ${directory} && java ${className}`);
          return { success: true, output };
        } catch (error) {
          return { success: false, error: error as string };
        } finally {
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(join(directory, `${className}.class`)).catch(() => {});
        }
      }
      
      case 'cpp':
      case 'c': {
        // For C/C++
        const extension = sanitizedLanguage === 'cpp' ? '.cpp' : '.c';
        const filepath = await createTempFile(code, extension);
        const outputPath = `${filepath}.out`;
        
        try {
          // Compile first
          const compiler = sanitizedLanguage === 'cpp' ? 'g++' : 'gcc';
          await executeCommand(`${compiler} ${filepath} -o ${outputPath}`);
          // Then run
          const output = await executeCommand(outputPath);
          return { success: true, output };
        } catch (error) {
          return { success: false, error: error as string };
        } finally {
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});
        }
      }
      
      case 'csharp': {
        // For C#
        const filepath = await createTempFile(code, '.cs');
        const outputPath = `${filepath}.exe`;
        
        try {
          // Compile first
          await executeCommand(`csc ${filepath} -out:${outputPath}`);
          // Then run
          const output = await executeCommand(`mono ${outputPath}`);
          return { success: true, output };
        } catch (error) {
          return { success: false, error: error as string };
        } finally {
          await fs.unlink(filepath).catch(() => {});
          await fs.unlink(outputPath).catch(() => {});
        }
      }
      
      case 'html': {
        // For HTML, we just return the HTML directly as there's no execution
        return { 
          success: true, 
          output: "HTML code cannot be executed directly. Use a browser to view the output." 
        };
      }
      
      case 'css': {
        // For CSS, we just return a message as there's no execution
        return { 
          success: true, 
          output: "CSS code cannot be executed directly. Use with HTML in a browser." 
        };
      }
      
      default:
        return { 
          success: false, 
          error: `Unsupported language: ${language}. Supported languages are JavaScript, Python, Java, C++, C, C#, HTML, and CSS.` 
        };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
