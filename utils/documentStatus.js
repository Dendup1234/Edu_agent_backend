// helper function for getting the document review
export const getDocumentReviewNotification = (status, documentName) => {
  const doc = documentName || "your document";

  switch (status) {
    case "approved":
      return {
        title: "Document Approved ",
        body: `Your ${doc} has been reviewed and approved successfully. No further action is required.`,
      };

    case "reupload":
      return {
        title: "Document Needs Re-upload ",
        body: `Your ${doc} requires re-upload. Please review the comments and submit an updated version.`,
      };

    case "rejected":
      return {
        title: "Document Rejected ",
        body: `Your ${doc} has been rejected`,
      };
    default:
      return null;
  }
};
