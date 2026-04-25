from qdrant_client import QdrantClient
c = QdrantClient(host='localhost', port=6433)
info = c.get_collection('airops_documents')
print(f'Collection: airops_documents')
print(f'Points: {info.points_count}')
print(f'Status: {info.status}')
print()
scroll = c.scroll(collection_name='airops_documents', limit=5)
for p in scroll[0]:
    doc = p.payload["document_name"][:40]
    art = p.payload.get("article", "N/A")
    text = p.payload["text"][:60]
    print(f'  [{p.id}] {doc} | {art} | {text}...')

# Verify Bistro is untouched
print()
b = QdrantClient(host='localhost', port=6333)
bc = [x.name for x in b.get_collections().collections]
print(f'Bistro Qdrant (6333): {bc} - INTACTO')
