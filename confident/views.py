from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.urls import reverse
from .models import PDFDocument
import os
from django.conf import settings
from django.contrib.auth.decorators import login_required
@login_required 
def pdf_list(request):
    """View to display list of PDFs and PDF viewer"""
    # Only use fields that exist in your database
    pdfs = PDFDocument.objects.all().values('id', 'title', 'description', 'uploaded_at').order_by('-uploaded_at')
    
    # If no PDF selected, use the first one by default if available
    default_pdf_id = None
    if pdfs.exists():
        default_pdf_id = pdfs.first()['id']
    
    selected_pdf_id = request.GET.get('pdf_id', default_pdf_id)
    selected_pdf = None
    
    if selected_pdf_id:
        try:
            selected_pdf = PDFDocument.objects.filter(id=selected_pdf_id).values(
                'id', 'title', 'description', 'uploaded_at').first()
        except:
            selected_pdf = None
    
    context = {
        'pdfs': pdfs,
        'selected_pdf': selected_pdf,
    }
    return render(request, 'pdf_app/pdf_list.html', context)  # Update template path
    """View to display list of PDFs and PDF viewer"""
    # Explicitly specify only the fields that exist in your database
    pdfs = PDFDocument.objects.all().values('id', 'title', 'description', 'file_size', 'uploaded_at').order_by('-uploaded_at')
    
    # If no PDF selected, use the first one by default if available
    default_pdf_id = None
    if pdfs.exists():
        default_pdf_id = pdfs.first()['id']
    
    selected_pdf_id = request.GET.get('pdf_id', default_pdf_id)
    selected_pdf = None
    
    if selected_pdf_id:
        try:
            # Explicitly specify fields again
            selected_pdf = PDFDocument.objects.filter(id=selected_pdf_id).values('id', 'title', 'description', 'file_size', 'uploaded_at').first()
        except:
            selected_pdf = None
    
    context = {
        'pdfs': pdfs,
        'selected_pdf': selected_pdf,
    }
    return render(request, 'confident/pdf_list.html', context)

def pdf_detail_api(request, pdf_id):
    """API endpoint to get PDF data for the viewer"""
    pdf = get_object_or_404(PDFDocument, id=pdf_id)
    
    # Try to get file size safely
    file_size = ''
    try:
        if hasattr(pdf, 'size_display'):
            file_size = pdf.size_display
        elif hasattr(pdf.file, 'size'):
            size = pdf.file.size
            if size < 1024:
                file_size = f"{size} bytes"
            elif size < 1024*1024:
                file_size = f"{size/1024:.1f} KB"
            else:
                file_size = f"{size/(1024*1024):.1f} MB"
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Error getting file size: {str(e)}")
    
    # Try to get filename safely
    try:
        filename = pdf.filename()
    except Exception as e:
        print(f"Error getting filename: {str(e)}")
        filename = os.path.basename(pdf.file.name) if pdf.file else f"document-{pdf.id}.pdf"
    
    # Return the PDF details as JSON
    return JsonResponse({
        'id': pdf.id,
        'title': pdf.title,
        'description': pdf.description or '',
        'file_url': reverse('pdf_content', args=[pdf.id]),
        'file_name': filename,
        'file_size': file_size,
        'uploaded_at': pdf.uploaded_at.isoformat(),
    })
def pdf_content(request, pdf_id):
    """Return the PDF content"""
    pdf = get_object_or_404(PDFDocument, id=pdf_id)
    
    try:
        # Get the filename from the model
        if pdf.file and pdf.file.name:
            filename = os.path.basename(pdf.file.name)
        else:
            return HttpResponse("PDF filename not found in database", status=404)
        
        # First try standard path (which isn't working based on logs)
        standard_path = os.path.join('/app/media/pdfs/', filename)
        
        # Then try the app's Draft Documents_DSS folder directly
        app_dir = os.path.dirname(os.path.abspath(__file__))
        draft_docs_path = os.path.join(app_dir, 'Draft Documents_DSS', filename)
        
        # For debugging
        print(f"Looking for PDF file: {filename}")
        print(f"Standard path: {standard_path}")
        print(f"Draft docs path: {draft_docs_path}")
        
        # Try to find the file
        if os.path.exists(standard_path):
            file_path = standard_path
        elif os.path.exists(draft_docs_path):
            file_path = draft_docs_path
        else:
            return HttpResponse(f"PDF file not found: {filename}", status=404)
        
        # Create the response with the PDF content
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['Cache-Control'] = 'public, max-age=3600'
        
        # Allow iframe embedding for this response
        response['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Open the file and stream it to the response
        with open(file_path, 'rb') as f:
            response.write(f.read())
            
        return response
        
    except Exception as e:
        print(f"Error serving PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return HttpResponse(f"Error loading PDF: {str(e)}", status=500)
def upload_pdf(request):
    """View to handle PDF uploads"""
    if request.method == 'POST':
        if 'pdf_file' in request.FILES:
            pdf_file = request.FILES['pdf_file']
            
            # Validate that it's actually a PDF
            if not pdf_file.name.lower().endswith('.pdf') and not pdf_file.content_type == 'application/pdf':
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'Only PDF files are accepted'}, status=400)
                return HttpResponse("Only PDF files are accepted", status=400)
                
            title = request.POST.get('title', pdf_file.name)
            description = request.POST.get('description', '')
            
            try:
                # Create a new PDF document with the file
                pdf_doc = PDFDocument(
                    title=title,
                    description=description,
                    file=pdf_file  # Just assign the file directly
                    # Don't set content_type since the column doesn't exist
                )
                pdf_doc.save()
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'redirect': f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}'
                    })
                return redirect(f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}')
            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': str(e)}, status=500)
                return HttpResponse(f"Error uploading PDF: {str(e)}", status=500)
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'No file was uploaded'}, status=400)
            return HttpResponse("No file was uploaded", status=400)
    
    # Render the upload form
    return render(request, 'pdf_app/upload.html')  # Adjust template path as needed
    """View to handle PDF uploads"""
    if request.method == 'POST':
        if 'pdf_file' in request.FILES:
            pdf_file = request.FILES['pdf_file']
            
            # Validate that it's actually a PDF
            if not pdf_file.name.lower().endswith('.pdf') and not pdf_file.content_type == 'application/pdf':
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'Only PDF files are accepted'}, status=400)
                return HttpResponse("Only PDF files are accepted", status=400)
                
            title = request.POST.get('title', pdf_file.name)
            description = request.POST.get('description', '')
            
            try:
                # Create a new PDF document with the file
                pdf_doc = PDFDocument(
                    title=title,
                    description=description,
                    file=pdf_file,  # Just assign the file directly
                    content_type=pdf_file.content_type
                )
                pdf_doc.save()
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'redirect': f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}'
                    })
                return redirect(f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}')
            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': str(e)}, status=500)
                return HttpResponse(f"Error uploading PDF: {str(e)}", status=500)
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'No file was uploaded'}, status=400)
            return HttpResponse("No file was uploaded", status=400)
    
    # Render the upload form
    return render(request, 'pdf_app/upload.html')  # Adjust template path as needed
    """View to handle PDF uploads"""
    if request.method == 'POST':
        if 'pdf_file' in request.FILES:
            pdf_file = request.FILES['pdf_file']
            
            # Validate that it's actually a PDF
            if not pdf_file.name.lower().endswith('.pdf') and not pdf_file.content_type == 'application/pdf':
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': 'Only PDF files are accepted'}, status=400)
                return HttpResponse("Only PDF files are accepted", status=400)
                
            title = request.POST.get('title', pdf_file.name)
            description = request.POST.get('description', '')
            
            try:
                # Create a new PDF document
                pdf_doc = PDFDocument(
                    title=title,
                    description=description,
                )
                
                # Set the file to be processed in the save method
                pdf_doc._file_to_save = pdf_file
                pdf_doc.save()
                
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({
                        'success': True,
                        'redirect': f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}'
                    })
                return redirect(f'{reverse("pdf_list")}?pdf_id={pdf_doc.id}')
            except Exception as e:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'error': str(e)}, status=500)
                return HttpResponse(f"Error uploading PDF: {str(e)}", status=500)
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'No file was uploaded'}, status=400)
            return HttpResponse("No file was uploaded", status=400)
    
    # Render the upload form
    return render(request, 'pdf_app/upload.html')

# Add this to your views.py temporarily for debugging
from django.http import HttpResponse
from django.db import connection

def inspect_database(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'confident_pdfdocument';")
        columns = [row[0] for row in cursor.fetchall()]
    
    return HttpResponse("<br>".join(columns))

# Add this to your urls.py
