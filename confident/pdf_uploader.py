import pandas as pd
from sqlalchemy import create_engine, text
import os
import datetime
import shutil

# Current directory (where script is)
base_dir = os.path.dirname(os.path.abspath(__file__))

# Database connection details - UPDATE THESE
DB_USER = 'myuser'
DB_PASSWORD = 'mypassword'
DB_HOST = 'localhost'
DB_PORT = '5431'
DB_NAME = 'mydatabase'

# Table name
TABLE_NAME = 'confident_pdfdocument'

# Create the database engine
engine = create_engine(f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

# Path to "Draft Documents_DSS" folder
pdf_dir = os.path.join(base_dir, 'Draft Documents_DSS')

# Path to the media/pdfs directory inside the app
media_dir = os.path.join(base_dir, 'media', 'pdfs')

def ensure_media_directory():
    """Make sure the media/pdfs directory exists"""
    os.makedirs(media_dir, exist_ok=True)
    print(f"Media directory: {media_dir}")

def check_for_duplicates(filename):
    """Check if PDF already exists in database"""
    try:
        with engine.connect() as connection:
            query = text(f"SELECT COUNT(*) FROM {TABLE_NAME} WHERE file LIKE :pattern")
            result = connection.execute(query, {"pattern": f"%{filename}"})
            count = result.scalar()
            return count > 0
    except Exception as e:
        print(f"Error checking for duplicates: {e}")
        return False

def add_pdfs_to_database():
    """Add PDFs to database and copy files to media directory"""
    # Ensure media directory exists
    ensure_media_directory()
    
    # Verify source folder exists
    if not os.path.exists(pdf_dir):
        print(f"Error: Folder not found at {pdf_dir}")
        return

    # Get all PDF files in the directory
    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]
    
    if not pdf_files:
        print(f"No PDF files found in {pdf_dir}")
        return
    
    print(f"Found {len(pdf_files)} PDF files to process")
    
    # Prepare data for database
    data = []
    current_time = datetime.datetime.now()
    
    added_count = 0
    copied_count = 0
    
    for filename in pdf_files:
        # Skip duplicates
        if check_for_duplicates(filename):
            print(f"Skipping {filename} - already in database")
            continue
            
        # Create title from filename
        title = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ')
        title = ' '.join(word.capitalize() for word in title.split())
        
        # Copy the file to media directory
        source_path = os.path.join(pdf_dir, filename)
        dest_path = os.path.join(media_dir, filename)
        
        try:
            if not os.path.exists(dest_path):
                print(f"Copying {filename} to media directory...")
                shutil.copy2(source_path, dest_path)
                print(f"  Success: {dest_path}")
                copied_count += 1
            else:
                print(f"File already exists in media directory: {filename}")
        except Exception as e:
            print(f"Error copying {filename}: {e}")
            # Skip adding to database if copy fails
            continue
        
        # Add to our data list
        data.append({
            'title': title,
            'description': f"Added from Draft Documents_DSS folder",
            'file': f'pdfs/{filename}',  # Format expected by Django
            'uploaded_at': current_time
        })
        added_count += 1
    
    if not data:
        print("No new PDFs to add to database")
        return
        
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Add to database
    try:
        df.to_sql(TABLE_NAME, engine, if_exists='append', index=False)
        print(f"Successfully added {added_count} PDFs to database")
        print(f"Copied {copied_count} files to media directory")
    except Exception as e:
        print(f"Error adding to database: {e}")

def copy_existing_files():
    """Copy files for existing database entries that haven't been copied yet"""
    # Get all PDFs from database
    try:
        with engine.connect() as connection:
            query = text(f"SELECT id, title, file FROM {TABLE_NAME}")
            result = connection.execute(query)
            pdfs = [dict(row) for row in result]
    except Exception as e:
        print(f"Error querying database: {e}")
        return
    
    if not pdfs:
        print("No PDFs found in the database")
        return
        
    print(f"\nChecking {len(pdfs)} existing database entries...")
    
    # Process each PDF
    copied_count = 0
    for pdf in pdfs:
        # Get the filename from the file path
        if pdf['file'] and '/' in pdf['file']:
            filename = pdf['file'].split('/')[-1]
        else:
            filename = pdf['file']
            
        # Source and destination paths
        source_path = os.path.join(pdf_dir, filename)
        dest_path = os.path.join(media_dir, filename)
        
        # Check if destination already exists
        if os.path.exists(dest_path):
            continue
            
        # Check if source file exists
        if not os.path.exists(source_path):
            print(f"Source file not found for ID {pdf['id']}: {source_path}")
            continue
            
        # Copy the file
        try:
            print(f"Copying existing entry: {filename} (ID: {pdf['id']})...")
            shutil.copy2(source_path, dest_path)
            print(f"  Success: {dest_path}")
            copied_count += 1
        except Exception as e:
            print(f"Error copying {filename}: {e}")
    
    print(f"Copied {copied_count} files for existing database entries")

if __name__ == "__main__":
    # Add new PDFs to database and copy files
    add_pdfs_to_database()
    
    # Copy files for existing database entries
    copy_existing_files()
    
    # Show what's in database
    print("\nCurrent database entries:")
    try:
        with engine.connect() as connection:
            query = text(f"SELECT id, title, file FROM {TABLE_NAME}")
            result = connection.execute(query)
            for row in result:
                print(f"ID: {row[0]}, Title: {row[1]}, File: {row[2]}")
    except Exception as e:
        print(f"Error querying database: {e}")
        
    print("\nPDF processing complete. The viewer should now work correctly.")