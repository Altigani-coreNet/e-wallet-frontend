import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
        onUpdate: ({ editor: ed }) => {
            onChange(ed.getHTML());
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
                <button type="button" title={t('admin.settings.contractTerms.editorBold')} onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
                    <strong>B</strong>
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorItalic')} onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
                    <em>I</em>
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorStrike')} onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
                    <s>S</s>
                </button>
                <span className="separator">|</span>
                <button type="button" title={t('admin.settings.contractTerms.editorH1')} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>
                    H1
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorH2')} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
                    H2
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorH3')} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>
                    H3
                </button>
                <span className="separator">|</span>
                <button type="button" title={t('admin.settings.contractTerms.editorListBullet')} onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
                    {t('admin.settings.contractTerms.editorListBullet')}
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorListOrdered')} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
                    {t('admin.settings.contractTerms.editorListOrdered')}
                </button>
                <span className="separator">|</span>
                <button type="button" title={t('admin.settings.contractTerms.editorAlignLeft')} onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}>
                    {t('admin.settings.contractTerms.editorAlignLeft')}
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorAlignCenter')} onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}>
                    {t('admin.settings.contractTerms.editorAlignCenter')}
                </button>
                <button type="button" title={t('admin.settings.contractTerms.editorAlignRight')} onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}>
                    {t('admin.settings.contractTerms.editorAlignRight')}
                </button>
            </div>
            <EditorContent editor={editor} className="tiptap-content" />
        </div>
    );
};

const AdminContractTermsIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [termsEn, setTermsEn] = useState('');
    const [termsAr, setTermsAr] = useState('');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewLang, setPreviewLang] = useState('en');

    useEffect(() => {
        setTitle(t('admin.settings.contractTerms.title'));
        setActions(null);
    }, [setTitle, setActions, t]);

    const fetchTerms = async () => {
        setLoading(true);
        const response = await getContractTerms();
        setLoading(false);

        if (response.success) {
            const data = response.data.data || response.data;
            setTermsEn(data.terms_en || '');
            setTermsAr(data.terms_ar || '');
        } else {
            toast.error(response.error || t('admin.settings.contractTerms.fetchFailed'));
        }
    };

    useEffect(() => {
        fetchTerms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const response = await updateContractTerms({ terms_en: termsEn, terms_ar: termsAr });
        setSaving(false);

        if (response.success) {
            toast.success(t('admin.settings.contractTerms.updateSuccess'));
        } else {
            toast.error(response.error || t('admin.settings.contractTerms.updateFailed'));
        }
    };

    const handlePreview = (lang) => {
        setPreviewLang(lang);
        setShowPreviewModal(true);
    };

    const handleDownload = async (lang) => {
        const response = await downloadTerms(lang);
        if (!response.success) {
            toast.error(response.error || t('admin.settings.contractTerms.downloadFailed'));
        }
    };

    if (loading) {
        return (
            <>
                <div className="card">
                    <div className="card-body text-center py-20">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('admin.common.loading')}</span>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="card shadow-sm mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.settings.contractTerms.cardEn')}</h3>
                    <div className="card-toolbar">
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                onClick={() => handlePreview('en')}
                                className="btn btn-sm btn-light-primary"
                            >
                                <i className="ki-duotone ki-eye fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('admin.settings.contractTerms.preview')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDownload('en')}
                                className="btn btn-sm btn-light-success"
                            >
                                <i className="ki-duotone ki-download fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('admin.settings.contractTerms.download')}
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

            <div className="card shadow-sm mb-5">
                <div className="card-header">
                    <h3 className="card-title">{t('admin.settings.contractTerms.cardAr')}</h3>
                    <div className="card-toolbar">
                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                onClick={() => handlePreview('ar')}
                                className="btn btn-sm btn-light-primary"
                            >
                                <i className="ki-duotone ki-eye fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('admin.settings.contractTerms.preview')}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDownload('ar')}
                                className="btn btn-sm btn-light-success"
                            >
                                <i className="ki-duotone ki-download fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('admin.settings.contractTerms.download')}
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

            <div className="d-flex justify-content-end">
                <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t('admin.settings.contractTerms.saving')}
                        </>
                    ) : (
                        <>
                            <i className="ki-duotone ki-check fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('admin.settings.contractTerms.saveBtn')}
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
