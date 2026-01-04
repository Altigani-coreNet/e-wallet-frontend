import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getContractTerms, updateContractTerms, downloadTerms } from '../../../../services/adminContractTermsService';
import ContractTermsPreviewModal from './ContractTermsPreviewModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Link } from '@tiptap/extension-link';
import './TipTapEditor.css';

const TipTapEditor = ({ content, onChange, direction = 'ltr' }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Color,
            TextStyle,
            FontFamily,
            Link.configure({ openOnClick: false })
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        }
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) return null;

    return (
        <div className="tiptap-editor" style={{ direction }}>
            <div className="tiptap-toolbar">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
                    <em>I</em>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>
                    <u>U</u>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
                    <s>S</s>
                </button>
                <span className="separator">|</span>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>
                    H1
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
                    H2
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>
                    H3
                </button>
                <span className="separator">|</span>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
                    • List
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
                    1. List
                </button>
                <span className="separator">|</span>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>
                    Left
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>
                    Center
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>
                    Right
                </button>
            </div>
            <EditorContent editor={editor} className="tiptap-content" />
        </div>
    );
};

const AdminContractTermsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [termsEn, setTermsEn] = useState('');
    const [termsAr, setTermsAr] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewLang, setPreviewLang] = useState('en');

    useEffect(() => {
        setTitle('Contract Terms Management');
        setActions(null);
        fetchTerms();
    }, [setTitle, setActions]);

    const fetchTerms = async () => {
        setLoading(true);
        const response = await getContractTerms();
        setLoading(false);

        if (response.success) {
            const data = response.data.data || response.data;
            setTermsEn(data.terms_en || '');
            setTermsAr(data.terms_ar || '');
        } else {
            toast.error(response.error || 'Failed to fetch contract terms');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const response = await updateContractTerms({ terms_en: termsEn, terms_ar: termsAr });
        setSaving(false);

        if (response.success) {
            toast.success('Contract terms updated successfully');
        } else {
            toast.error(response.error || 'Failed to update contract terms');
        }
    };

    const handlePreview = (lang) => {
        setPreviewLang(lang);
        setShowPreviewModal(true);
    };

    const handleDownload = async (lang) => {
        const response = await downloadTerms(lang);
        if (!response.success) {
            toast.error(response.error || 'Failed to download terms');
        }
    };


    if (loading) {
        return (
            <>
                    <div className="card">
                        <div className="card-body text-center py-20">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    </div>
            </>
        );
    }

    return (
        <>
                {/* English Terms */}
                <div className="card shadow-sm mb-5">
                    <div className="card-header">
                        <h3 className="card-title">Contract Terms (English)</h3>
                        <div className="card-toolbar">
                            <div className="d-flex gap-2">
                                <button 
                                    onClick={() => handlePreview('en')}
                                    className="btn btn-sm btn-light-primary"
                                >
                                    <i className="ki-duotone ki-eye fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    Preview
                                </button>
                                <button 
                                    onClick={() => handleDownload('en')}
                                    className="btn btn-sm btn-light-success"
                                >
                                    <i className="ki-duotone ki-download fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <TipTapEditor 
                            content={termsEn}
                            onChange={setTermsEn}
                            direction="ltr"
                        />
                    </div>
                </div>

                {/* Arabic Terms */}
                <div className="card shadow-sm mb-5">
                    <div className="card-header">
                        <h3 className="card-title">Contract Terms (Arabic)</h3>
                        <div className="card-toolbar">
                            <div className="d-flex gap-2">
                                <button 
                                    onClick={() => handlePreview('ar')}
                                    className="btn btn-sm btn-light-primary"
                                >
                                    <i className="ki-duotone ki-eye fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    Preview
                                </button>
                                <button 
                                    onClick={() => handleDownload('ar')}
                                    className="btn btn-sm btn-light-success"
                                >
                                    <i className="ki-duotone ki-download fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <TipTapEditor 
                            content={termsAr}
                            onChange={setTermsAr}
                            direction="rtl"
                        />
                    </div>
                </div>

                {/* Save Button */}
                <div className="d-flex justify-content-end">
                    <button 
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Updating...
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Update Contract Terms
                            </>
                        )}
                    </button>
                </div>
            
            <ContractTermsPreviewModal 
                show={showPreviewModal}
                lang={previewLang}
                onClose={() => setShowPreviewModal(false)}
            />
        </>
    );
};

export default AdminContractTermsIndex;

